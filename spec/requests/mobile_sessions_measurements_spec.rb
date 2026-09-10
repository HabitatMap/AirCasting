require 'rails_helper'

describe 'POST /api/v3/mobile_sessions/:mobile_session_uuid/measurements' do
  let(:user) { create(:user) }
  let(:threshold_set) { create(:threshold_set, :air_beam_pm2_5, :default) }
  let(:session) { create(:mobile_session, user: user, time_zone: 'America/New_York') }

  let!(:stream) do
    Stream.create!(
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
  end

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  # The scheme the shipped iOS/Android builds use: user token as the Basic
  # username, literal "X" as the password.
  def basic(token)
    { 'Authorization' => "Basic #{Base64.strict_encode64("#{token}:X")}" }
  end

  def post_measurements(uuid:, body:, headers: {})
    post "/api/v3/mobile_sessions/#{uuid}/measurements",
         params: body,
         headers: { 'CONTENT_TYPE' => 'application/octet-stream' }.merge(headers)
  end

  def build_binary(type_id: 2, epoch: Time.current.to_i - 60, value: 12.5, lat: 40.7128, lng: -74.006)
    header = ["\xAB\xBA", 1].pack('a2n')
    payload = header + [epoch, type_id, value, lat, lng].pack('NCgGG')
    payload + [payload.bytes.inject(0, :^)].pack('C')
  end

  describe 'authentication' do
    it 'accepts Bearer <user_token> (the v3 scheme)' do
      expect { post_measurements(uuid: session.uuid, body: build_binary, headers: bearer(user.authentication_token)) }
        .to change { stream.measurements.count }.by(1)

      expect(response).to have_http_status(:ok)
    end

    # This API is new, so it never inherited the deprecated Basic scheme. Only
    # /api/v3/fixed_sessions keeps it, for the builds already in the field.
    it 'rejects the deprecated Basic <token:X> scheme' do
      expect { post_measurements(uuid: session.uuid, body: build_binary, headers: basic(user.authentication_token)) }
        .not_to change(Measurement, :count)

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error_code']).to eq('unauthorized')
    end

    it 'returns the v3 401 body for an invalid Bearer token' do
      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer('nonsense'))

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq('error_code' => 'unauthorized', 'message' => 'Unauthorized')
    end

    it 'returns 401 when no credentials are sent' do
      post_measurements(uuid: session.uuid, body: build_binary)

      expect(response).to have_http_status(:unauthorized)
    end

    # Regression: Devise's `authenticate_user!` throws to Warden, whose failure app
    # builds a fresh response and drops headers set by the around_action.
    it 'includes X-Server-Time on 401' do
      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer('nonsense'))

      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  describe 'session lookup' do
    it "returns 404 for another user's session, without ingesting" do
      other_session = create(:mobile_session, user: create(:user))

      expect { post_measurements(uuid: other_session.uuid, body: build_binary, headers: bearer(user.authentication_token)) }
        .not_to change(Measurement, :count)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 404 with X-Server-Time for an unknown uuid' do
      post_measurements(uuid: 'no-such-uuid', body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:not_found)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  describe 'empty body (time synchronisation)' do
    it 'returns 200 with X-Server-Time without looking up the session' do
      post_measurements(uuid: 'no-such-uuid', body: '', headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:ok)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  describe 'malformed payload' do
    it 'returns 400 with the parser error_code' do
      post_measurements(uuid: session.uuid, body: 'not binary at all', headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('invalid_magic_bytes')
    end
  end
end
