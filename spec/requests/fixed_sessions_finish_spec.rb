require 'rails_helper'

describe 'POST /api/v3/fixed_sessions/:uuid/finish' do
  let(:user) { create(:user) }
  let(:session_record) do
    create(:fixed_session, user: user, title: 'Rooftop PM2.5 monitor', version: 2)
  end

  def finish_session(uuid, token: user.authentication_token)
    post "/api/v3/fixed_sessions/#{uuid}/finish",
         headers: {
           'ACCEPT' => 'application/json',
           'Authorization' => "Bearer #{token}",
         }
  end

  it 'decommissions the session and answers with the same shape as show' do
    create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')

    finish_session(session_record.uuid)

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json['finished_at']).to be_present
    expect(json['version']).to eq(3)
    expect(json).to include('uuid', 'tag_list', 'share_url', 'device', 'streams', 'last_measurement_at')
    expect(session_record.reload.finished_at).to be_present
  end

  it 'puts finished_at on the wire as a real UTC instant in epoch ms' do
    # Not a local wall clock: `finished_at` is a timestamptz, so unlike
    # start_time / end_time it needs no zone to interpret. A monitor deployed in
    # a non-UTC zone would expose a conversion applied by mistake.
    session_record.update!(time_zone: 'America/New_York')
    now = Time.utc(2026, 5, 23, 11, 58, 40)

    travel_to(now) { finish_session(session_record.uuid) }

    expect(response.parsed_body['finished_at']).to eq(now.to_i * 1_000)
  end

  it 'finishes a monitor that is still reporting' do
    # A decommission outranks the silence signal: the owner is saying the sensor
    # is coming down, which `last_measurement_at` cannot express — a monitor that
    # reported a minute ago still reads active by that measure alone.
    session_record.update!(last_measurement_at: Time.current)

    finish_session(session_record.uuid)

    expect(response).to have_http_status(:ok)
    session_record.reload
    expect(session_record.finished_at).to be_present
    expect(session_record.last_measurement_at).to be_present
  end

  it 'is safe to retry — the second call keeps the first timestamp' do
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
    session_record.update!(tag_list: 'rooftop,pm')

    finish_session(session_record.uuid)

    session_record.reload
    expect(session_record.title).to eq('Rooftop PM2.5 monitor')
    expect(session_record.tag_list.to_a).to match_array(%w[rooftop pm])
  end

  it 'matches the uuid case-insensitively, like every other session lookup' do
    finish_session(session_record.uuid.upcase)

    expect(response).to have_http_status(:ok)
    expect(session_record.reload.finished_at).to be_present
  end

  it 'returns 404 for a uuid the user does not own' do
    someone_else = create(:fixed_session, user: create(:user))

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

  it 'will not finish a mobile session through the fixed route' do
    # The two finishes are separate services because the transition means
    # different things; the scoping to `current_user.fixed_sessions` is what
    # keeps a mobile session from taking the fixed path.
    mobile = create(:mobile_session, user: user)

    finish_session(mobile.uuid)

    expect(response).to have_http_status(:not_found)
    expect(mobile.reload.finished_at).to be_nil
  end
end
