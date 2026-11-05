require 'rails_helper'

describe 'GET /api/v3/explore/stations/:uuid/measurements', type: :request do
  let(:anchor) { Time.utc(2026, 8, 14, 12, 0, 0) }
  let(:recent) { anchor - 30.minutes }
  let(:old) { anchor - 10.hours }

  def epoch_ms(time) = time.to_i * 1_000

  def get_measurements(uuid, params)
    get "/api/v3/explore/stations/#{uuid}/measurements", params: params
  end

  def airbeam_session(**attributes)
    create(
      :fixed_session,
      contribute: true,
      is_indoor: false,
      time_zone: 'America/New_York',
      last_measurement_at: anchor,
      **attributes,
    )
  end

  def airbeam_stream(session, sensor_name: 'AirBeamMini-PM2.5')
    create(:stream, :fixed, session: session, sensor_name: sensor_name)
  end

  def airbeam_measurement(stream, value:, at:)
    create(:fixed_measurement, stream: stream, value: value, time: at, time_with_time_zone: at)
  end

  def government_station(**attributes)
    source = create(:source, name: 'EPA', full_name: 'US EPA AirNow')
    station = create(:station, source: source, **attributes)
    stream =
      create(
        :station_stream,
        source: source,
        station: station,
        stream_configuration: create(:stream_configuration, measurement_type: 'PM2.5'),
        last_measured_at: anchor,
      )
    [station.reload, stream]
  end

  describe 'an AirBeam fixed session' do
    let(:session) { airbeam_session }
    let!(:stream) { airbeam_stream(session) }
    let!(:other_stream) { airbeam_stream(session, sensor_name: 'AirBeamMini-RH') }

    before do
      airbeam_measurement(stream, value: 12.5, at: recent)
      airbeam_measurement(stream, value: 9.0, at: old)
      airbeam_measurement(other_stream, value: 44.0, at: recent)
    end

    # No token, like the map and the station detail it is opened from.
    it 'serves the last 6h of the named stream without authentication' do
      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5')

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq(
        [{ 'time' => epoch_ms(recent), 'value' => 12.5 }],
      )
    end

    # Both columns are written from one timestamp, so they agree on real rows;
    # forcing them apart is the only way to show which one bounds the window.
    # The fixed-session endpoint reaches the same instants from the other column
    # by converting — see Explore::StationMeasurementsQuery.
    it 'reads the window off time_with_time_zone, not the local-as-UTC column' do
      create(
        :fixed_measurement,
        stream: stream, value: 77.0,
        time: recent, time_with_time_zone: recent - 2.days,
      )

      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5')

      expect(response.parsed_body.map { |point| point['value'] }).to eq([12.5])
    end

    it 'answers an explicit window in epoch milliseconds' do
      get_measurements(
        session.uuid,
        sensor_name: 'AirBeamMini-PM2.5',
        start_time: epoch_ms(anchor - 11.hours),
        end_time: epoch_ms(anchor - 9.hours),
      )

      expect(response.parsed_body).to eq([{ 'time' => epoch_ms(old), 'value' => 9.0 }])
    end

    it 'is empty, not 404, when the stream reported nothing in the window' do
      get_measurements(
        session.uuid,
        sensor_name: 'AirBeamMini-RH',
        start_time: epoch_ms(anchor - 2.hours),
        end_time: epoch_ms(anchor - 1.hour),
      )

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end

    it 'matches the uuid case-insensitively, as the detail endpoint does' do
      get_measurements(session.uuid.upcase, sensor_name: 'AirBeamMini-PM2.5')

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe 'a government station' do
    let(:station_and_stream) { government_station }
    let(:station) { station_and_stream.first }
    let(:station_stream) { station_and_stream.last }

    before do
      create(:station_measurement, station_stream: station_stream, measured_at: recent, value: 8.5)
      create(:station_measurement, station_stream: station_stream, measured_at: old, value: 3.0)
    end

    # The synthetic name the station detail returns for a government stream.
    it 'serves the stream under its Government-<pollutant> name' do
      get_measurements(station.uuid, sensor_name: 'Government-PM2.5')

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([{ 'time' => epoch_ms(recent), 'value' => 8.5 }])
    end

    it 'answers an explicit window' do
      get_measurements(
        station.uuid,
        sensor_name: 'Government-PM2.5',
        start_time: epoch_ms(anchor - 11.hours),
        end_time: epoch_ms(anchor - 9.hours),
      )

      expect(response.parsed_body).to eq([{ 'time' => epoch_ms(old), 'value' => 3.0 }])
    end
  end

  describe 'what is not served' do
    # Private, indoor, excluded and unknown all answer the same 404 — a private
    # session must not be distinguishable from a missing one.
    it '404s a session that is not contributed' do
      session = airbeam_session(contribute: false)
      airbeam_stream(session)

      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to include(
        'error_code' => 'not_found', 'message' => 'Station not found',
      )
    end

    it '404s an indoor session' do
      session = airbeam_session(is_indoor: true)
      airbeam_stream(session)

      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['message']).to eq('Station not found')
    end

    it '404s an excluded government station' do
      station, = government_station(excluded_reason: Station::EXCLUDED_REASONS[:temporary])

      get_measurements(station.uuid, sensor_name: 'Government-PM2.5')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['message']).to eq('Station not found')
    end

    it '404s an unknown uuid, in either format' do
      get_measurements(SecureRandom.uuid, sensor_name: 'Government-PM2.5')
      expect(response).to have_http_status(:not_found)

      get_measurements('not-a-uuid', sensor_name: 'AirBeamMini-PM2.5')
      expect(response).to have_http_status(:not_found)
    end

    # A named stream the station does not have is a wrong request, not an empty
    # one, and the message says which name was wrong.
    it '404s a stream the station does not have, naming it' do
      session = airbeam_session
      airbeam_stream(session)

      get_measurements(session.uuid, sensor_name: 'AirBeam3-RH')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('not_found')
      expect(response.parsed_body['message']).to include('AirBeam3-RH')
    end
  end

  describe 'the query' do
    let(:session) { airbeam_session }

    before { airbeam_stream(session) }

    it 'requires sensor_name — never the whole station' do
      get_measurements(session.uuid, {})

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(response.parsed_body['fields']).to include('sensor_name')
    end

    it 'rejects half a window' do
      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5',
                       start_time: epoch_ms(anchor - 1.hour))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['fields']).to include('end_time')
    end

    it 'rejects a window wider than 12 hours' do
      get_measurements(session.uuid, sensor_name: 'AirBeamMini-PM2.5',
                       start_time: epoch_ms(anchor - 13.hours),
                       end_time: epoch_ms(anchor))

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['fields']['end_time'].first['code']).to eq('window_too_long')
    end

    # Validated before the uuid is looked up, so a malformed query answers the
    # same 400 whatever station it names.
    it 'answers 400, not 404, when both the query and the uuid are wrong' do
      get_measurements('not-a-uuid', {})

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
    end
  end
end
