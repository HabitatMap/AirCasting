require 'rails_helper'

# Clients generate the uuid and are not consistent about case: iOS hands over
# Foundation's uppercase `UUID().uuidString` while the AirBeam firmware puts a
# lowercase one in the URL it posts to. The uniqueness index is on LOWER(uuid),
# so an exact match can miss a session that does exist.
describe 'session lookup by uuid, whatever case the client sends' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  describe 'mobile sessions' do
    let(:session) { create(:mobile_session, user: user, uuid: SecureRandom.uuid) }
    let(:uppercased) { session.uuid.upcase }

    it 'finds the session on show' do
      get "/api/v3/mobile_sessions/#{uppercased}", headers: bearer(user.authentication_token)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['uuid']).to eq(session.uuid)
    end

    it 'finds the session on destroy' do
      delete "/api/v3/mobile_sessions/#{uppercased}", headers: bearer(user.authentication_token)

      expect(response).to have_http_status(:no_content)
      expect(MobileSession.where(id: session.id)).to be_empty
    end

    it 'finds the session on a measurement upload' do
      threshold_set = create(:threshold_set, :air_beam_pm2_5, :default)
      stream = Stream.create!(
        session: session,
        sensor_name: 'AirBeamMini-PM2.5',
        sensor_package_name: 'AA:BB:CC:DD:EE:FF',
        unit_name: 'micrograms per cubic meter',
        measurement_type: 'Particulate Matter',
        measurement_short_type: 'PM',
        unit_symbol: 'µg/m³',
        threshold_set: threshold_set,
        sensor_type_id: 2,
      )
      header = ["\xAB\xBA", 1].pack('a2n')
      payload = header + [Time.current.to_i - 60, 2, 12.5, 40.7128, -74.006].pack('NCgGG')
      binary = payload + [payload.bytes.inject(0, :^)].pack('C')

      expect {
        post "/api/v3/mobile_sessions/#{uppercased}/measurements",
             params: binary,
             headers: { 'CONTENT_TYPE' => 'application/octet-stream' }.merge(bearer(user.authentication_token))
      }.to change { stream.measurements.count }.by(1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'fixed sessions' do
    let(:session) do
      create(:fixed_session, user: user, uuid: SecureRandom.uuid, session_token: SecureRandom.hex(10))
    end

    it 'authenticates a measurement upload by session token' do
      epoch = Time.current.to_i - 60
      payload = ["\xAB\xBA", 1].pack('a2n') + [epoch, 1, 10.0].pack('NCg')
      binary = payload + [payload.bytes.inject(0, :^)].pack('C')

      post "/api/v3/fixed_sessions/#{session.uuid.upcase}/measurements",
           params: binary,
           headers: { 'CONTENT_TYPE' => 'application/octet-stream' }
             .merge(bearer(session.session_token))

      expect(response).to have_http_status(:ok)
    end

    # The legacy AirBeam path — /api/realtime/measurements — resolves the session
    # through this repository.
    it 'finds the session through FixedSessionsRepository' do
      found = FixedSessionsRepository.new.find_by(user_id: user.id, uuid: session.uuid.upcase)

      expect(found).to eq(session)
    end
  end
end
