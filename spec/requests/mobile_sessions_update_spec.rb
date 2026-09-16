require 'rails_helper'

describe 'PATCH /api/v3/mobile_sessions/:uuid' do
  let(:user) { create(:user) }
  let(:session_record) { create(:mobile_session, user: user, title: 'Bike ride', version: 2) }

  def patch_session(uuid, body, token: user.authentication_token)
    patch "/api/v3/mobile_sessions/#{uuid}",
          params: body.to_json,
          headers: {
            'CONTENT_TYPE' => 'application/json',
            'ACCEPT' => 'application/json',
            'Authorization' => "Bearer #{token}",
          }
  end

  it 'renames the session and answers with the same shape as show' do
    create(:note, session: session_record, number: 0)

    patch_session(session_record.uuid, { title: 'Renamed ride' })

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json['title']).to eq('Renamed ride')
    expect(json['version']).to eq(3)
    expect(json).to include('uuid', 'tag_list', 'share_url', 'device', 'streams', 'notes')
  end

  it 'matches the uuid case-insensitively, like every other session lookup' do
    patch_session(session_record.uuid.upcase, { title: 'Renamed ride' })

    expect(response).to have_http_status(:ok)
  end

  it 'returns 400 for an empty payload instead of bumping the version' do
    patch_session(session_record.uuid, {})

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error_code']).to eq('validation_error')
    expect(session_record.reload.version).to eq(2)
  end

  it 'ignores device and streams — this endpoint owns neither' do
    device = create(:device, user: user, mac_address: 'AA:BB:CC:DD:EE:01', name: 'Backpack')
    session_record.update!(device: device)
    stream = create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')

    patch_session(
      session_record.uuid,
      {
        title: 'Renamed ride',
        device: { mac_address: 'AA:BB:CC:DD:EE:01', name: 'Renamed device' },
        streams: [{ sensor_name: 'AirBeamMini-PM2.5', deleted: true }],
      },
    )

    expect(response).to have_http_status(:ok)
    expect(device.reload.name).to eq('Backpack')
    expect(Stream.where(id: stream.id)).to be_present
  end

  it "returns 404 for another user's session — never 403, which would confirm it exists" do
    other = create(:mobile_session, user: create(:user))

    patch_session(other.uuid, { title: 'Renamed ride' })

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
    expect(other.reload.title).not_to eq('Renamed ride')
  end

  it 'returns 404 for an unknown uuid' do
    patch_session('does-not-exist', { title: 'Renamed ride' })

    expect(response).to have_http_status(:not_found)
  end

  it 'returns 401 without a valid token' do
    patch_session(session_record.uuid, { title: 'Renamed ride' }, token: 'invalid')

    expect(response).to have_http_status(:unauthorized)
  end

  it 'is not routed for PUT — the endpoint is partial, never a full replace' do
    expect {
      put "/api/v3/mobile_sessions/#{session_record.uuid}",
          params: { title: 'x' }.to_json,
          headers: { 'CONTENT_TYPE' => 'application/json' }
    }.to raise_error(ActionController::RoutingError)
  end
end
