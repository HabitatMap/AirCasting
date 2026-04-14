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

  before do
    stream
    sign_in user
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
    end
  end
end
