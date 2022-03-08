require 'rails_helper'

describe Api::Fixed::Active::SessionsController do
  describe '#index' do
    it 'returns active sessions json' do
      user = create_user!
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      create_dormant_session_and_stream!(user: user, session_time: session_time)
      active_session, active_stream =
        create_active_session_and_stream!(
          user: user,
          session_time: session_time
        )

      get :index,
          params: {
            q: {
              time_from:
                session_time.to_datetime.strftime('%Q').to_i / 1_000 - 1,
              time_to: session_time.to_datetime.strftime('%Q').to_i / 1_000 + 1,
              tags: '',
              usernames: '',
              session_ids: [],
              west: active_session.longitude - 1,
              east: active_session.longitude + 1,
              south: active_session.latitude - 1,
              north: active_session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: active_stream.sensor_name,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol
            }.to_json
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_hour_average' => active_session.measurements.last.value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'type' => 'FixedSession',
            'username' => user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' => active_stream.measurement_short_type,
                'average_value' => nil,
                'id' => active_stream.id,
                'max_latitude' => active_stream.max_latitude,
                'max_longitude' => active_stream.max_longitude,
                'measurement_type' => active_stream.measurement_type,
                'measurements_count' => 1,
                'min_latitude' => active_stream.min_latitude,
                'min_longitude' => active_stream.min_longitude,
                'sensor_name' => active_stream.sensor_name,
                'sensor_package_name' => active_stream.sensor_package_name,
                'session_id' => active_session.id,
                'size' => 1,
                'start_latitude' => active_stream.start_latitude,
                'start_longitude' => active_stream.start_longitude,
                'threshold_high' => active_stream.threshold_high,
                'threshold_low' => active_stream.threshold_low,
                'threshold_medium' => active_stream.threshold_medium,
                'threshold_very_high' => active_stream.threshold_very_high,
                'threshold_very_low' => active_stream.threshold_very_low,
                'unit_name' => active_stream.unit_name,
                'unit_symbol' => active_stream.unit_symbol
              }
            }
          }
        ]
      }

      expect(json_response).to eq(expected)
    end
  end

  describe '#index2' do
    it 'returns active sessions json' do
      user = create_user!
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      create_dormant_session_and_stream!(user: user, session_time: session_time)
      active_session, active_stream =
        create_active_session_and_stream!(
          user: user,
          session_time: session_time
        )

      get :index2,
          params: {
            q: {
              time_from:
                session_time.to_datetime.strftime('%Q').to_i / 1_000 - 1,
              time_to: session_time.to_datetime.strftime('%Q').to_i / 1_000 + 1,
              tags: '',
              usernames: '',
              session_ids: [],
              west: active_session.longitude - 1,
              east: active_session.longitude + 1,
              south: active_session.latitude - 1,
              north: active_session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: active_stream.sensor_name,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol
            }.to_json
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_measurement_value' => active_stream.average_value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'username' => user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' => active_stream.measurement_short_type,
                'sensor_name' => active_stream.sensor_name,
                'unit_symbol' => active_stream.unit_symbol
              }
            }
          }
        ]
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
        last_measurement_at: DateTime.current
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
          DateTime.current - (FixedSession::ACTIVE_FOR + 1.second)
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
      password: 'password'
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
      start_time: DateTime.current,
      start_time_local: time,
      end_time: DateTime.current,
      end_time_local: time,
      is_indoor: false,
      latitude: latitude,
      longitude: longitude,
      contribute: contribute,
      last_measurement_at: last_measurement_at
    )
  end

  def create_stream!(session:, latitude:, longitude:)
    Stream.create!(
      session: session,
      sensor_name: 'AirBeam2-F',
      measurement_short_type: 'F',
      measurement_type: 'Temperature',
      sensor_package_name: 'Airbeam2-0018961071B4',
      unit_name: 'fahrenheit',
      unit_symbol: 'F',
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      min_latitude: latitude,
      max_latitude: latitude,
      min_longitude: longitude,
      max_longitude: longitude,
      start_latitude: latitude,
      start_longitude: longitude
    )
  end

  def create_measurement!(stream:)
    Measurement.create!(
      time: DateTime.current,
      latitude: 123,
      longitude: 123,
      value: 123,
      milliseconds: 123,
      stream: stream
    )
  end
end
