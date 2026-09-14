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

  describe 'payload size cap' do
    let(:max) { ::MobileSessions::BinaryProtocol::Parser::MAX_MEASUREMENTS }

    def build_binary_with(frame_count, epoch: Time.current.to_i - frame_count)
      header = ["\xAB\xBA", frame_count].pack('a2n')
      payload = header + Array.new(frame_count) { |i|
        [epoch + i, 2, 12.5, 40.7128, -74.006].pack('NCgGG')
      }.join
      payload + [payload.bytes.inject(0, :^)].pack('C')
    end

    it 'accepts a payload of exactly the cap' do
      expect {
        post_measurements(uuid: session.uuid, body: build_binary_with(max), headers: bearer(user.authentication_token))
      }.to change { stream.measurements.count }.by(max)

      expect(response).to have_http_status(:ok)
    end

    it 'returns 413 one frame over the cap and stores nothing' do
      expect {
        post_measurements(
          uuid: session.uuid,
          body: build_binary_with(max + 1),
          headers: bearer(user.authentication_token),
        )
      }.not_to change(Measurement, :count)

      expect(response).to have_http_status(:payload_too_large)
      expect(response.parsed_body['error_code']).to eq('payload_too_large')
    end

    # Decided on Content-Length alone, before the body is read and before the
    # session is looked up — a wrong uuid still answers 413, not 404.
    it 'answers before looking the session up' do
      post_measurements(uuid: 'no-such-uuid', body: build_binary_with(max + 1), headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:payload_too_large)
    end
  end

  describe 'a rival upload holding the stream' do
    it 'answers 503 with Retry-After so the client knows to come back' do
      allow(Measurement).to receive(:import)
        .and_raise(ActiveRecord::LockWaitTimeout.new('canceling statement due to lock timeout'))

      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:service_unavailable)
      expect(response.parsed_body['error_code']).to eq('try_again_later')
      expect(response.headers['Retry-After']).to eq('5')
    end
  end

  describe 'sensor_type_id the session has no stream for' do
    it 'returns 400 unsupported_sensor_type and stores nothing' do
      expect {
        post_measurements(
          uuid: session.uuid,
          body: build_binary(type_id: 99),
          headers: bearer(user.authentication_token),
        )
      }.not_to change(Measurement, :count)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('unsupported_sensor_type')
    end

    it 'rejects the whole payload, not only the offending frames' do
      header = ["\xAB\xBA", 2].pack('a2n')
      epoch = Time.current.to_i - 60
      payload = header +
                [epoch, 2, 12.5, 40.7128, -74.006].pack('NCgGG') +
                [epoch + 1, 99, 13.5, 40.7128, -74.006].pack('NCgGG')
      body = payload + [payload.bytes.inject(0, :^)].pack('C')

      expect {
        post_measurements(uuid: session.uuid, body: body, headers: bearer(user.authentication_token))
      }.not_to change(Measurement, :count)

      expect(response).to have_http_status(:bad_request)
      expect(stream.reload.measurements_count).to eq(0)
    end
  end

  describe 'monitoring' do
    let(:monitor) do
      instance_double(
        ::BinaryProtocol::Monitor,
        report_parse_error: nil,
        report_unknown_sensor_type: nil,
        report_import_failure: nil,
        report_transaction_error: nil,
        report_session_not_found: nil,
        report_auth_failure: nil,
      )
    end

    before do
      allow(::BinaryProtocol::Monitor).to receive(:new)
        .with(source: ::BinaryProtocol::Monitor::MOBILE)
        .and_return(monitor)
    end

    it 'reports a rejected credential' do
      expect(monitor).to receive(:report_auth_failure).with(session_uuid: session.uuid)

      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer('nonsense'))

      expect(response).to have_http_status(:unauthorized)
    end

    it 'reports an upload aimed at a session the caller does not own' do
      other = create(:mobile_session, user: create(:user))

      expect(monitor).to receive(:report_session_not_found).with(session_uuid: other.uuid)

      post_measurements(uuid: other.uuid, body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:not_found)
    end

    it 'stays quiet on a successful upload' do
      expect(monitor).not_to receive(:report_auth_failure)
      expect(monitor).not_to receive(:report_session_not_found)

      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:ok)
    end
  end
end
