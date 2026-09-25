require 'rails_helper'

describe 'POST /api/v3/mobile_sessions/:uuid/finish' do
  let(:user) { create(:user) }
  let(:session_record) do
    create(:mobile_session, user: user, title: 'Bike ride', version: 2)
  end

  def finish_session(uuid, token: user.authentication_token)
    post "/api/v3/mobile_sessions/#{uuid}/finish",
         headers: {
           'ACCEPT' => 'application/json',
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

  it 'takes no body' do
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
