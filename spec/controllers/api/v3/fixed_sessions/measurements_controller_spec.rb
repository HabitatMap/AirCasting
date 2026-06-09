require 'rails_helper'

RSpec.describe Api::V3::FixedSessions::MeasurementsController do
  let(:user) { create(:user) }
  let(:session) { create(:fixed_session, user: user, time_zone: 'UTC', session_token: 'test-session-token-abc') }
  let(:threshold_set) { create(:threshold_set) }
  let(:stream) do
    Stream.create!(
      session: session,
      sensor_name: 'AirBeam-PM2.5',
      sensor_package_name: 'AA:BB:CC:DD:EE:FF',
      unit_name: 'micrograms per cubic meter',
      unit_symbol: 'µg/m³',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      threshold_set: threshold_set,
      sensor_type_id: 2,
      min_latitude: session.latitude,
      max_latitude: session.latitude,
      min_longitude: session.longitude,
      max_longitude: session.longitude,
    )
  end

  def build_binary(measurements)
    count = measurements.size
    header = ["\xAB\xBA", count].pack('a2n')
    body = measurements.map { |m| [m[:epoch], m[:sensor_type_id], m[:value]].pack('NCg') }.join
    payload = header + body
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  let(:monitor) { instance_double(FixedSessions::BinaryProtocol::Monitor, report_parse_error: nil, report_unknown_sensor_type: nil, report_transaction_error: nil, report_session_not_found: nil, report_auth_failure: nil) }

  before do
    stream
    sign_in user
    allow(FixedSessions::BinaryProtocol::Monitor).to receive(:new).and_return(monitor)
  end

  describe 'POST #create' do
    let(:binary) do
      build_binary([{ epoch: 1_711_619_400, sensor_type_id: 2, value: 25.5 }])
    end

    it 'returns 200 for valid binary' do
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return(binary)
        req
      end
      post :create, params: { fixed_session_uuid: session.uuid }
      expect(response).to have_http_status(:ok)
    end

    it 'creates a FixedMeasurement' do
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return(binary)
        req
      end
      expect {
        post :create, params: { fixed_session_uuid: session.uuid }
      }.to change(FixedMeasurement, :count).by(1)
    end

    it 'returns 400 for invalid binary' do
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return('not valid binary')
        req
      end
      post :create, params: { fixed_session_uuid: session.uuid }
      expect(response).to have_http_status(:bad_request)
    end

    it 'returns 404 when session does not belong to user' do
      other_session = create(:fixed_session, user: create(:user))
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return(binary)
        req
      end
      post :create, params: { fixed_session_uuid: other_session.uuid }
      expect(response).to have_http_status(:not_found)
    end

    it 'reports session not found to monitor' do
      other_session = create(:fixed_session, user: create(:user))
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return(binary)
        req
      end
      expect(monitor).to receive(:report_session_not_found).with(
        session_uuid: other_session.uuid,
        auth_method: 'basic',
      )
      post :create, params: { fixed_session_uuid: other_session.uuid }
    end

    it 'reports parse error to monitor for invalid binary' do
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return('not valid binary')
        req
      end
      expect(monitor).to receive(:report_parse_error)
      post :create, params: { fixed_session_uuid: session.uuid }
    end

    it 'does not report errors for valid requests' do
      allow(controller).to receive(:request).and_wrap_original do |m|
        req = m.call
        allow(req).to receive_message_chain(:body, :read).and_return(binary)
        req
      end
      expect(monitor).not_to receive(:report_parse_error)
      expect(monitor).not_to receive(:report_session_not_found)
      expect(monitor).not_to receive(:report_auth_failure)
      post :create, params: { fixed_session_uuid: session.uuid }
    end

    context 'authenticated via Bearer session token (AirBeam)' do
      before do
        sign_out user
        request.headers['Authorization'] = "Bearer #{session.session_token}"
      end

      it 'returns 200 for valid binary' do
        allow(controller).to receive(:request).and_wrap_original do |m|
          req = m.call
          allow(req).to receive_message_chain(:body, :read).and_return(binary)
          req
        end
        post :create, params: { fixed_session_uuid: session.uuid }
        expect(response).to have_http_status(:ok)
      end

      it 'returns 401 for an invalid session token' do
        request.headers['Authorization'] = 'Bearer wrong-token'
        post :create, params: { fixed_session_uuid: session.uuid }
        expect(response).to have_http_status(:unauthorized)
      end

      it 'reports auth failure to monitor for invalid token' do
        request.headers['Authorization'] = 'Bearer wrong-token'
        expect(monitor).to receive(:report_auth_failure).with(
          session_uuid: session.uuid,
        )
        post :create, params: { fixed_session_uuid: session.uuid }
      end
    end
  end
end
