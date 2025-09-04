require 'rails_helper'

describe Api::Fixed::Dormant::SessionsController do
  describe '#index' do
    it 'returns dormant sessions json' do
      user = create_user!
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      create_active_session_and_stream!(user: user, session_time: session_time)
      dormant_session, dormant_stream =
        create_dormant_session_and_stream!(
          user: user,
          session_time: session_time,
        )

      last_hourly_average =
        create(:stream_hourly_average, stream: dormant_stream, value: 12)
      dormant_stream.update(last_hourly_average: last_hourly_average)

      get :index,
          params: {
            q: {
              time_from:
                session_time.to_datetime.strftime('%Q').to_i / 1_000 - 1,
              time_to: session_time.to_datetime.strftime('%Q').to_i / 1_000 + 1,
              tags: '',
              usernames: '',
              session_ids: [],
              west: dormant_session.longitude - 1,
              east: dormant_session.longitude + 1,
              south: dormant_session.latitude - 1,
              north: dormant_session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: dormant_stream.sensor_name,
              measurement_type: dormant_stream.measurement_type,
              unit_symbol: dormant_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => dormant_session.id,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'is_indoor' => dormant_session.is_indoor,
            'latitude' => dormant_session.latitude,
            'longitude' => dormant_session.longitude,
            'title' => dormant_session.title,
            'type' => 'FixedSession',
            'username' => user.username,
            'last_hourly_average_value' => 12,
            'streams' => {
              dormant_stream.sensor_name => {
                'average_value' => 12,
                'id' => dormant_stream.id,
                'max_latitude' => dormant_stream.max_latitude,
                'max_longitude' => dormant_stream.max_longitude,
                'measurement_short_type' =>
                  dormant_stream.measurement_short_type,
                'measurement_type' => dormant_stream.measurement_type,
                'measurements_count' => 1,
                'min_latitude' => dormant_stream.min_latitude,
                'min_longitude' => dormant_stream.min_longitude,
                'sensor_name' => dormant_stream.sensor_name,
                'sensor_package_name' => dormant_stream.sensor_package_name,
                'session_id' => dormant_session.id,
                'size' => 1,
                'start_latitude' => dormant_stream.start_latitude,
                'start_longitude' => dormant_stream.start_longitude,
                'threshold_high' => dormant_stream.threshold_set.threshold_high,
                'threshold_low' => dormant_stream.threshold_set.threshold_low,
                'threshold_medium' =>
                  dormant_stream.threshold_set.threshold_medium,
                'threshold_very_high' =>
                  dormant_stream.threshold_set.threshold_very_high,
                'threshold_very_low' =>
                  dormant_stream.threshold_set.threshold_very_low,
                'unit_name' => dormant_stream.unit_name,
                'unit_symbol' => dormant_stream.unit_symbol,
              },
            },
          },
        ],
      }

      expect(json_response).to eq(expected)
    end
  end

  private

  def create_active_session_and_stream!(user:, session_time:)
    latitude = 123
    longitude = 234
    session =
      create_fixed_session!(
        user: user,
        contribute: true,
        time: session_time,
        latitude: latitude,
        longitude: longitude,
        last_measurement_at: DateTime.current,
      )
    stream =
      create_stream!(session: session, latitude: latitude, longitude: longitude)
    create_measurement!(stream: stream)

    [session, stream]
  end

  def create_dormant_session_and_stream!(user:, session_time:)
    latitude = 123
    longitude = 234
    session =
      create_fixed_session!(
        user: user,
        contribute: true,
        time: session_time,
        latitude: latitude,
        longitude: longitude,
        last_measurement_at:
          DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
      )
    stream =
      create_stream!(session: session, latitude: latitude, longitude: longitude)
    create_measurement!(stream: stream)

    [session, stream]
  end

  def create_user!
    User.create!(
      username: 'username',
      email: 'email@example.com',
      password: 'password',
    )
  end

  def create_fixed_session!(
    user:,
    time:,
    contribute:,
    latitude:,
    longitude:,
    last_measurement_at:
  )
    FixedSession.create!(
      title: 'title',
      user: user,
      uuid: SecureRandom.uuid,
      start_time_local: time,
      end_time_local: time,
      is_indoor: false,
      latitude: latitude,
      longitude: longitude,
      contribute: contribute,
      last_measurement_at: last_measurement_at,
    )
  end

  def create_stream!(session:, latitude:, longitude:)
    threshold_set =
      ThresholdSet.create!(
        threshold_very_low: 20,
        threshold_low: 60,
        threshold_medium: 70,
        threshold_high: 80,
        threshold_very_high: 100,
        unit_symbol: 'F',
        sensor_name: 'AirBeam2-F',
      )

    Stream.create!(
      session: session,
      sensor_name: 'AirBeam2-F',
      measurement_short_type: 'F',
      measurement_type: 'Temperature',
      sensor_package_name: 'Airbeam2-0018961071B4',
      unit_name: 'fahrenheit',
      unit_symbol: 'F',
      threshold_set: threshold_set,
      min_latitude: latitude,
      max_latitude: latitude,
      min_longitude: longitude,
      max_longitude: longitude,
      start_latitude: latitude,
      start_longitude: longitude,
    )
  end

  def create_measurement!(stream:)
    Measurement.create!(
      time: DateTime.current,
      latitude: 123,
      longitude: 123,
      value: 123,
      milliseconds: 123,
      stream: stream,
      location: 'SRID=4326;POINT(123 123)',
    )
  end
end
