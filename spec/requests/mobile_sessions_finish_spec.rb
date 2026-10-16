require 'rails_helper'

describe 'POST /api/v3/mobile_sessions/:uuid/finish' do
  let(:user) { create(:user) }
  let(:session_record) do
    create(:mobile_session, user: user, title: 'Bike ride', version: 2)
  end

  def finish_session(uuid, token: user.authentication_token, body: nil)
    post "/api/v3/mobile_sessions/#{uuid}/finish",
         params: body && body.to_json,
         headers: {
           'ACCEPT' => 'application/json',
           'CONTENT_TYPE' => 'application/json',
           'Authorization' => "Bearer #{token}",
         }
  end

  it 'marks the session finished and answers with the same shape as show' do
    create(:note, session: session_record, number: 0)

    finish_session(session_record.uuid)

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json['finished_at']).to be_present
    expect(json['version']).to eq(3)
    expect(json).to include('uuid', 'tag_list', 'share_url', 'device', 'streams', 'notes')
    expect(session_record.reload.finished_at).to be_present
  end

  it 'puts finished_at on the wire as a real UTC instant in epoch ms' do
    # Not a local wall clock: `finished_at` is a timestamptz, so unlike
    # start_time / end_time it needs no zone to interpret. A session recorded in
    # a non-UTC zone would expose a conversion applied by mistake.
    session_record.update!(time_zone: 'America/New_York')
    now = Time.utc(2026, 5, 23, 11, 58, 40)

    travel_to(now) { finish_session(session_record.uuid) }

    expect(response.parsed_body['finished_at']).to eq(now.to_i * 1_000)
  end

  it 'takes no body — the installed apps send none' do
    finish_session(session_record.uuid)

    expect(response).to have_http_status(:ok)
  end

  it 'is safe to retry — the second call keeps the first timestamp' do
    # The case this endpoint is shaped around: the app finishes a session, the
    # response is lost on a flaky connection, and the queued request runs again.
    # Answering 409 there would strand a client with no way to tell "already
    # done" from "failed".
    finish_session(session_record.uuid)
    declared = session_record.reload.finished_at

    finish_session(session_record.uuid)

    expect(response).to have_http_status(:ok)
    expect(session_record.reload.finished_at).to eq(declared)
  end

  it 'does not bump version a second time on a repeat' do
    # version is the sync token — a retried finish must not push the session to
    # every other device again.
    finish_session(session_record.uuid)
    expect(session_record.reload.version).to eq(3)

    finish_session(session_record.uuid)

    expect(session_record.reload.version).to eq(3)
  end

  describe 'a client-declared finished_at' do
    # The whole point of the parameter: the tap that ended the recording and the
    # request reporting it are separated by however long the phone was offline.
    # The app stops uploading at the tap, so server time would both mis-state
    # when the session ended and leave MeasurementCutoff sitting after the last
    # frame that exists.
    let(:declared_at) { Time.utc(2026, 5, 23, 9, 30, 0) }

    it 'stores the instant the client declares, not the instant it was received' do
      received_at = declared_at + 3.hours

      travel_to(received_at) do
        finish_session(session_record.uuid, body: { finished_at: declared_at.to_i * 1_000 })
      end

      expect(response).to have_http_status(:ok)
      expect(session_record.reload.finished_at).to eq(declared_at)
      expect(response.parsed_body['finished_at']).to eq(declared_at.to_i * 1_000)
    end

    it 'reads the value as a real UTC instant, not a session-local wall clock' do
      # Unlike start_time / end_time, finished_at is a timestamptz on both sides
      # of the wire. A session recorded in a non-UTC zone would expose a
      # conversion applied by mistake.
      session_record.update!(time_zone: 'America/New_York')

      travel_to(declared_at + 1.hour) do
        finish_session(session_record.uuid, body: { finished_at: declared_at.to_i * 1_000 })
      end

      expect(session_record.reload.finished_at).to eq(declared_at)
    end

    it 'still bumps version once, and the retry keeps the declared instant' do
      travel_to(declared_at + 1.hour) do
        finish_session(session_record.uuid, body: { finished_at: declared_at.to_i * 1_000 })
        finish_session(session_record.uuid, body: { finished_at: (declared_at + 10.minutes).to_i * 1_000 })
      end

      session_record.reload
      expect(response).to have_http_status(:ok)
      expect(session_record.finished_at).to eq(declared_at)
      expect(session_record.version).to eq(3)
    end

    it 'drops the sub-second part, so the value round-trips exactly' do
      travel_to(declared_at + 1.hour) do
        finish_session(session_record.uuid, body: { finished_at: (declared_at.to_i * 1_000) + 789 })
      end

      expect(response.parsed_body['finished_at']).to eq(declared_at.to_i * 1_000)
      expect(session_record.reload.finished_at).to eq(declared_at)
    end

    it 'treats an explicit null as "no declared instant" and uses server time' do
      now = Time.utc(2026, 5, 23, 11, 58, 40)

      travel_to(now) { finish_session(session_record.uuid, body: { finished_at: nil }) }

      expect(response).to have_http_status(:ok)
      expect(session_record.reload.finished_at).to eq(now)
    end

    it 'accepts the current instant sent with millisecond precision' do
      # The boundary case of the future check, and the one a correctly-synced
      # client hits: the server compares whole seconds, so the sub-second part of
      # a "finish now" must not be read as a future instant.
      now = Time.utc(2026, 5, 23, 11, 58, 40)

      travel_to(now) do
        finish_session(session_record.uuid, body: { finished_at: (now.to_i * 1_000) + 999 })
      end

      expect(response).to have_http_status(:ok)
      expect(session_record.reload.finished_at).to eq(now)
    end

    it 'rejects an instant that has not happened yet' do
      # No allowance for a handset clock running ahead: a future finished_at
      # would hold the measurement cutoff open past every frame the session has.
      now = Time.utc(2026, 5, 23, 11, 58, 40)

      travel_to(now) do
        finish_session(session_record.uuid, body: { finished_at: (now + 1.minute).to_i * 1_000 })
      end

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(response.parsed_body['fields']['finished_at']).to include('must not be in the future')
      expect(session_record.reload.finished_at).to be_nil
    end

    it 'takes any past instant, however implausible — there is no floor' do
      # Deliberate. Nothing the server knows bounds a past finished_at:
      # `created_at` can legitimately follow it, because a session recorded
      # offline from the start is only created when the phone reconnects, and no
      # fixed date helps either — the value that destroys a session is a
      # plausible one a few years before it, which any cutoff wide enough to
      # admit real sessions also admits. Nor does start_time_local: a finish
      # landing before it is already discarding the backlog such a check would
      # have been for. A client sending epoch seconds drops its own
      # measurements, and that is the client's to get right.
      seconds_not_ms = Time.utc(2026, 5, 23).to_i

      finish_session(session_record.uuid, body: { finished_at: seconds_not_ms })

      expect(response).to have_http_status(:ok)
      expect(session_record.reload.finished_at).to eq(Time.at(seconds_not_ms / 1_000).utc)
    end

    it 'rejects a non-integer finished_at' do
      finish_session(session_record.uuid, body: { finished_at: 'yesterday' })

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(session_record.reload.finished_at).to be_nil
    end

    it 'does not let one user declare a finish on another user\'s session' do
      someone_else = create(:mobile_session, user: create(:user))

      finish_session(someone_else.uuid, body: { finished_at: declared_at.to_i * 1_000 })

      expect(response).to have_http_status(:not_found)
      expect(someone_else.reload.finished_at).to be_nil
    end
  end

  it 'leaves title and tags alone — this is a transition, not an edit' do
    session_record.update!(tag_list: 'commute,bike')

    finish_session(session_record.uuid)

    session_record.reload
    expect(session_record.title).to eq('Bike ride')
    expect(session_record.tag_list.to_a).to match_array(%w[commute bike])
  end

  it 'matches the uuid case-insensitively, like every other session lookup' do
    finish_session(session_record.uuid.upcase)

    expect(response).to have_http_status(:ok)
    expect(session_record.reload.finished_at).to be_present
  end

  it 'returns 404 for a uuid the user does not own' do
    someone_else = create(:mobile_session, user: create(:user))

    finish_session(someone_else.uuid)

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
    expect(someone_else.reload.finished_at).to be_nil
  end

  it 'returns 404 for an unknown uuid' do
    finish_session('does-not-exist')

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it 'returns 401 without a valid token' do
    finish_session(session_record.uuid, token: 'invalid')

    expect(response).to have_http_status(:unauthorized)
    expect(session_record.reload.finished_at).to be_nil
  end

  it 'will not finish a fixed session through the mobile route' do
    # Fixed sessions finish through their own endpoint, because the transition
    # means something different there (decommissioning a monitor, not ending a
    # recording). The scoping to `current_user.mobile_sessions` is what keeps the
    # two apart.
    fixed = create(:fixed_session, user: user)

    finish_session(fixed.uuid)

    expect(response).to have_http_status(:not_found)
    expect(fixed.reload.finished_at).to be_nil
  end
end
