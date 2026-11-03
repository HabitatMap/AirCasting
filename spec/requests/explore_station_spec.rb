require 'rails_helper'

describe 'GET /api/v3/explore/stations/:uuid', type: :request do
  let(:measured_at) { 1.hour.ago.change(usec: 0) }

  def get_station(uuid)
    get "/api/v3/explore/stations/#{uuid}"
    JSON.parse(response.body)
  end

  def airbeam_session(**attributes)
    create(
      :fixed_session,
      latitude: 40.1,
      longitude: -73.2,
      time_zone: 'America/New_York',
      last_measurement_at: 5.minutes.ago,
      **attributes,
    ).tap do |session|
      stream =
        create(
          :stream,
          session: session,
          sensor_name: 'AirBeamMini-PM2.5',
          measurement_type: 'Particulate Matter',
          unit_symbol: 'µg/m³',
          sensor_package_name: 'AirBeamMini:00189610719f',
        )
      create(:fixed_measurement, stream: stream, value: 8.4,
             time: measured_at, time_with_time_zone: measured_at)
    end
  end

  def government_station(**attributes)
    source = create(:source, name: 'EPA', full_name: 'US EPA AirNow')
    station =
      create(:station, source: source, title: 'CCNY',
             location: 'SRID=4326;POINT(-73.9483 40.8198)', **attributes)
    stream =
      create(:station_stream, source: source, station: station,
             stream_configuration: create(:stream_configuration, measurement_type: 'PM2.5',
                                          unit_symbol: 'µg/m³'),
             location: station.location, first_measured_at: measured_at,
             last_measured_at: measured_at)
    create(:station_measurement, station_stream: stream, measured_at: measured_at, value: 8.5)
    station.reload
  end

  # The endpoint is public, like the map it is opened from.
  it 'serves an AirBeam session without a token' do
    session = airbeam_session

    json = get_station(session.uuid)

    expect(response).to have_http_status(:ok)
    expect(json).to include(
      'source' => 'airbeam', 'uuid' => session.uuid, 'is_active' => true,
      'time_zone' => 'America/New_York',
    )
    expect(json['share_url']).to end_with("/s/#{session.url_token}")
  end

  it 'serves a government station, with a /g/ share link and no device' do
    station = government_station(url_token: 'ab3k9')

    json = get_station(station.uuid)

    expect(response).to have_http_status(:ok)
    expect(json).to include(
      'source' => 'government', 'uuid' => station.uuid, 'device_model' => nil,
      'time_zone' => 'Europe/Warsaw',
    )
    expect(json['share_url']).to end_with('/g/ab3k9')
  end

  # Every station gets a token once the backfill has drained; until then the key
  # is absent rather than null, so a client is not handed a link to nowhere.
  it 'omits share_url for a government station with no token yet' do
    station = government_station(url_token: nil)

    json = get_station(station.uuid)

    expect(response).to have_http_status(:ok)
    expect(json).not_to have_key('share_url')
  end

  it 'serves a session that stopped reporting, flagged inactive and with no 24h range' do
    session = airbeam_session(last_measurement_at: 3.days.ago)
    session.streams.first.fixed_measurements.update_all(
      time: 3.days.ago, time_with_time_zone: 3.days.ago,
    )

    json = get_station(session.uuid)

    expect(json).to include('is_active' => false)
    expect(json['streams'].first).to include('last_24h' => nil)
    expect(json['streams'].first['last_measurement']).to be_present
  end

  it 'serves a session its owner finished' do
    session = airbeam_session(finished_at: 1.hour.ago)

    expect(get_station(session.uuid)).to include('is_active' => false)
  end

  # The same 404 for every reason, so a private session is not distinguishable
  # from a missing one.
  it 'answers 404 for a private, an indoor, an excluded and an unknown item alike' do
    private_session = airbeam_session(contribute: false)
    indoor = airbeam_session(is_indoor: true)
    excluded = government_station(excluded_reason: Station::EXCLUDED_REASONS[:temporary])

    [private_session.uuid, indoor.uuid, excluded.uuid, SecureRandom.uuid, 'not-a-uuid'].each do |uuid|
      json = get_station(uuid)

      expect(response).to have_http_status(:not_found)
      expect(json).to eq('error_code' => 'not_found', 'message' => 'Station not found')
    end
  end
end
