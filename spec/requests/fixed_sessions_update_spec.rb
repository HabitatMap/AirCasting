require 'rails_helper'

describe 'PATCH /api/v3/fixed_sessions/:uuid' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  let(:session_record) { create(:fixed_session, user: user, title: 'Rooftop monitor', version: 2) }

  def patch_session(uuid, body, headers = {})
    patch "/api/v3/fixed_sessions/#{uuid}",
          params: body.to_json,
          headers: {
            'CONTENT_TYPE' => 'application/json',
            'ACCEPT' => 'application/json',
          }.merge(headers)
  end

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  before { sign_in user }

  it 'renames the session and answers with the same shape as the list item' do
    patch_session(session_record.uuid, { title: 'Rooftop monitor (v2)' })

    expect(response).to have_http_status(:ok)
    json = response.parsed_body
    expect(json['title']).to eq('Rooftop monitor (v2)')
    expect(json['version']).to eq(3)
    expect(json).to include('uuid', 'tag_list', 'is_indoor', 'contribute', 'share_url', 'device', 'streams')
  end

  it 'matches the uuid case-insensitively, like every other session lookup' do
    patch_session(session_record.uuid.upcase, { title: 'Rooftop monitor (v2)' })

    expect(response).to have_http_status(:ok)
  end

  it 'returns 400 for an empty payload instead of bumping the version' do
    patch_session(session_record.uuid, {})

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error_code']).to eq('validation_error')
    expect(session_record.reload.version).to eq(2)
  end

  it 'ignores device, streams and is_indoor — this endpoint owns none of them' do
    device = create(:device, user: user, mac_address: 'AA:BB:CC:DD:EE:01', name: 'Roof sensor')
    session_record.update!(device: device)
    stream = create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')

    patch_session(
      session_record.uuid,
      {
        title: 'Rooftop monitor (v2)',
        device: { mac_address: 'AA:BB:CC:DD:EE:01', name: 'Renamed device' },
        streams: [{ sensor_name: 'AirBeamMini-PM2.5', deleted: true }],
        is_indoor: true,
      },
    )

    expect(response).to have_http_status(:ok)
    expect(device.reload.name).to eq('Roof sensor')
    expect(Stream.where(id: stream.id)).to be_present
    expect(session_record.reload.is_indoor).to eq(false)
  end

  it "returns 404 for another user's session — never 403, which would confirm it exists" do
    other = create(:fixed_session, user: create(:user))

    patch_session(other.uuid, { title: 'Rooftop monitor (v2)' })

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
    expect(other.reload.title).not_to eq('Rooftop monitor (v2)')
  end

  it 'returns 404 for an unknown uuid' do
    patch_session('does-not-exist', { title: 'Rooftop monitor (v2)' })

    expect(response).to have_http_status(:not_found)
  end

  it 'refuses a mobile session through the fixed route' do
    mobile = create(:mobile_session, user: user)

    patch_session(mobile.uuid, { title: 'Rooftop monitor (v2)' })

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it 'accepts the bearer token the mobile app sends' do
    sign_out user

    patch_session(session_record.uuid, { title: 'Rooftop monitor (v2)' }, bearer(user.authentication_token))

    expect(response).to have_http_status(:ok)
  end

  # The session_token authenticates measurement uploads from the AirBeam, not
  # session management — the device must not be able to rename the session.
  it 'rejects the session_token that authenticates uploads' do
    sign_out user
    session_record.update!(session_token: SecureRandom.hex(16))

    patch_session(session_record.uuid, { title: 'Rooftop monitor (v2)' }, bearer(session_record.session_token))

    expect(response).to have_http_status(:unauthorized)
  end

  it 'returns 401 without a valid token' do
    sign_out user

    patch_session(session_record.uuid, { title: 'Rooftop monitor (v2)' }, bearer('invalid'))

    expect(response).to have_http_status(:unauthorized)
  end
end
