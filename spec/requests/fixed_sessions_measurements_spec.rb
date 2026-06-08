require 'rails_helper'

describe 'POST /api/v3/fixed_sessions/:fixed_session_uuid/measurements' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  let(:session) { create(:fixed_session, user: user) }

  def post_measurements(uuid:, body:, headers: {})
    post "/api/v3/fixed_sessions/#{uuid}/measurements",
         params: body,
         headers: { 'CONTENT_TYPE' => 'application/octet-stream' }.merge(headers)
  end

  def build_binary
    epoch = Time.current.to_i - 60
    header = ["\xAB\xBA", 1].pack('a2n')
    frame = [epoch, 1, 10.0].pack('NCg')
    payload = header + frame
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  context 'with empty body (time synchronisation)' do
    before { sign_in user }

    it 'returns 200 without looking up the session' do
      post_measurements(uuid: 'any-uuid', body: '')
      expect(response).to have_http_status(:ok)
    end

    it 'includes X-Server-Time header' do
      post_measurements(uuid: 'any-uuid', body: '')
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  context 'when session does not exist' do
    before { sign_in user }

    it 'returns 404' do
      post_measurements(uuid: 'non-existent-uuid', body: build_binary)
      expect(response).to have_http_status(:not_found)
    end

    it 'includes X-Server-Time header on 404' do
      post_measurements(uuid: 'non-existent-uuid', body: build_binary)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  context 'with valid Bearer session token' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 200' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response).to have_http_status(:ok)
    end

    it 'includes X-Server-Time header' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  context 'with invalid Bearer token and no Basic auth' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 401' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer wrong-token' },
      )
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'with Bearer token for wrong session UUID' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 401' do
      post_measurements(
        uuid: 'different-uuid',
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'when not authenticated' do
    it 'returns 401' do
      post_measurements(uuid: session.uuid, body: build_binary)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'includes X-Server-Time header on 401' do
      post_measurements(uuid: session.uuid, body: build_binary)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end
end
