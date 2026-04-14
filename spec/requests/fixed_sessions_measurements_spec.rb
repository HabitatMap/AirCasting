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

  context 'with empty body (time synchronisation)' do
    before { sign_in user }

    it 'returns 200 without looking up the session' do
      post_measurements(uuid: 'any-uuid', body: '')
      expect(response).to have_http_status(:ok)
    end
  end

  context 'when session does not exist' do
    before { sign_in user }

    def build_binary
      epoch = Time.current.to_i - 60
      header = ["\xAB\xBA", 1].pack('a2n')
      frame = [epoch, 1, 10.0].pack('NCg')
      payload = header + frame
      checksum = payload.bytes.inject(0, :^)
      payload + [checksum].pack('C')
    end

    it 'returns 404' do
      post_measurements(uuid: 'non-existent-uuid', body: build_binary)
      expect(response).to have_http_status(:not_found)
    end
  end
end
