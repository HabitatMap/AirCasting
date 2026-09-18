require 'rails_helper'

describe 'GET /api/v3/mobile_sessions/:mobile_session_uuid/measurements' do
  let(:user) { create(:user) }
  let(:session) do
    create(:mobile_session, user: user, time_zone: 'UTC',
                            end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
  end
  let!(:stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5') }
  let!(:other_stream) { create(:stream, session: session, sensor_name: 'AirBeamMini-PM1') }

  let(:recent_time) { Time.utc(2026, 8, 14, 11, 30, 0) }
  let(:old_time) { Time.utc(2026, 8, 14, 2, 0, 0) }

  def epoch_ms(time) = time.to_i * 1_000
  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  def get_measurements(uuid: session.uuid, params: { sensor_name: 'AirBeamMini-PM2.5' },
                       headers: bearer(user.authentication_token))
    get "/api/v3/mobile_sessions/#{uuid}/measurements", params: params, headers: headers
  end

  before do
    stream.build_measurements!([
      { time: recent_time, value: 12.5, latitude: 40.0, longitude: -74.0 },
      { time: old_time, value: 9.0, latitude: 41.0, longitude: -75.0 },
    ])
  end

  describe 'the default fetch (no window)' do
    it 'returns the last 6h of the named stream as a flat array' do
      get_measurements

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        [{ 'time' => epoch_ms(recent_time), 'value' => 12.5, 'latitude' => 40.0, 'longitude' => -74.0 }],
      )
    end

    it 'sets X-Server-Time' do
      get_measurements

      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  describe 'sensor_name' do
    it 'is required — this endpoint never answers for the whole session' do
      get_measurements(params: {})

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(response.parsed_body['fields']).to include('sensor_name')
    end

    it 'returns 404 when the session has no such stream' do
      get_measurements(params: { sensor_name: 'AirBeam3-RH' })

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('not_found')
      expect(response.parsed_body['message']).to include('AirBeam3-RH')
    end

    # Second device on the same account opens a session the first phone created
    # but has not uploaded to yet. The streams exist from session creation, so
    # this is an empty recording, not a wrong request.
    it 'returns [] for a stream that exists but has no measurements yet' do
      fresh = create(:mobile_session, user: user, time_zone: 'UTC', end_time_local: nil)
      create(:stream, session: fresh, sensor_name: 'AirBeamMini-PM2.5')

      get_measurements(uuid: fresh.uuid)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end

    it 'reads only the stream it names' do
      other_stream.build_measurements!(
        [{ time: recent_time, value: 1.0, latitude: 40.0, longitude: -74.0 }],
      )

      get_measurements(params: { sensor_name: 'AirBeamMini-PM1' })

      expect(response.parsed_body.map { |p| p['value'] }).to eq([1.0])
    end
  end

  describe 'an explicit window' do
    let(:window) do
      { sensor_name: 'AirBeamMini-PM2.5', start_time: epoch_ms(old_time),
        end_time: epoch_ms(Time.utc(2026, 8, 14, 12, 0, 0)) }
    end

    it 'returns the points inside it, oldest first' do
      get_measurements(params: window)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |p| p['time'] })
        .to eq([epoch_ms(old_time), epoch_ms(recent_time)])
    end

    it 'rejects a window wider than 12 hours' do
      get_measurements(params: window.merge(start_time: epoch_ms(Time.utc(2026, 8, 13, 23, 0, 0))))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['fields']['end_time'].join).to include('12 hours')
    end

    it 'accepts a window of exactly 12 hours' do
      get_measurements(params: window.merge(start_time: epoch_ms(Time.utc(2026, 8, 14, 0, 0, 0))))

      expect(response).to have_http_status(:ok)
    end

    it 'rejects end_time <= start_time' do
      get_measurements(params: window.merge(start_time: window[:end_time]))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['fields']['end_time'].join).to include('greater than start_time')
    end

    it 'rejects half a window' do
      get_measurements(params: window.except(:end_time))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['fields']).to include('end_time')
    end

    it 'rejects a non-numeric time instead of silently answering 1970' do
      get_measurements(params: window.merge(start_time: 'abc'))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
    end
  end

  describe 'malformed query' do
    # Regression: these reached ActiveRecord as ActionController::Parameters and
    # raised TypeError ("can't cast ActionController::Parameters") — a 500.
    it 'answers 400 for a hash-shaped sensor_name' do
      get "/api/v3/mobile_sessions/#{session.uuid}/measurements?sensor_name[foo]=bar",
          headers: bearer(user.authentication_token)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
    end

    it 'is answered before the session is looked up' do
      get_measurements(uuid: 'no-such-uuid', params: {})

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'session lookup' do
    it "returns 404 for another user's session" do
      other = create(:mobile_session, user: create(:user))

      get_measurements(uuid: other.uuid)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 404 for an unknown uuid' do
      get_measurements(uuid: 'no-such-uuid')

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'authentication' do
    # The binary-protocol monitor watches the ingest path only; a 401 on this
    # read must not land in the upload metrics.
    it 'does not report to the binary-protocol monitor' do
      monitor = instance_double(::BinaryProtocol::Monitor, report_auth_failure: nil,
                                                           report_session_not_found: nil)
      allow(::BinaryProtocol::Monitor).to receive(:new).and_return(monitor)
      expect(monitor).not_to receive(:report_auth_failure)
      expect(monitor).not_to receive(:report_session_not_found)

      get_measurements(headers: bearer('nonsense'))
      get_measurements(uuid: 'no-such-uuid')

      expect(response).to have_http_status(:not_found)
    end

    it 'returns 401 for an invalid token' do
      get_measurements(headers: bearer('nonsense'))

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq('error_code' => 'unauthorized', 'message' => 'Unauthorized')
    end

    it 'returns 401 without credentials' do
      get_measurements(headers: {})

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
