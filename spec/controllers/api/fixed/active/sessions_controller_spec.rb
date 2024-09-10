require 'rails_helper'

describe Api::Fixed::Active::SessionsController do
  describe '#index' do
    it 'returns active sessions json' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      active_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
        )
      active_stream =
        create_stream!(
          session: active_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      create_measurement!(stream: active_stream)
      dormant_session =
        create_fixed_session!(
          user: active_session.user,
          contribute: true,
          time: session_time,
          last_measurement_at:
            DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      dormant_stream =
        create_stream!(
          session: dormant_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      create_measurement!(stream: dormant_stream)

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
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'uuid' => active_session.uuid,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_hour_average' => active_session.measurements.last.value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'type' => 'FixedSession',
            'username' => active_session.user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' =>
                  active_stream.measurement_short_type,
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
                'threshold_high' => active_stream.threshold_set.threshold_high,
                'threshold_low' => active_stream.threshold_set.threshold_low,
                'threshold_medium' => active_stream.threshold_set.threshold_medium,
                'threshold_very_high' => active_stream.threshold_set.threshold_very_high,
                'threshold_very_low' => active_stream.threshold_set.threshold_very_low,
                'unit_name' => active_stream.unit_name,
                'unit_symbol' => active_stream.unit_symbol,
              },
            },
          },
        ],
      }

      expect(json_response).to eq(expected)
    end
  end

  describe '#index2' do
    it 'returns active sessions json' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      active_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
        )
      active_stream =
        create_stream!(
          session: active_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      create_measurement!(stream: active_stream)
      dormant_session =
        create_fixed_session!(
          user: active_session.user,
          contribute: true,
          time: session_time,
          last_measurement_at:
            DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      dormant_stream =
        create_stream!(
          session: dormant_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      daily_stream_average =
        create_stream_daily_average!(stream: active_stream)

      create_measurement!(stream: dormant_stream)

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
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'uuid' => active_session.uuid,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_measurement_value' => active_stream.average_value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'is_active' => active_session.is_active,
            'username' => active_session.user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' =>
                  active_stream.measurement_short_type,
                'sensor_name' => active_stream.sensor_name,
                'unit_symbol' => active_stream.unit_symbol,
                'id' => active_stream.id,
                'stream_daily_average' => daily_stream_average.value.round,
              },
            },
          },
        ],
      }

      expect(json_response).to eq(expected)
    end

    it 'returns government data' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      active_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
        )
      active_stream =
        create_stream!(
          session: active_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
          sensor_name: 'Government-PM2.5',
        )
      create_measurement!(stream: active_stream)
      dormant_session =
        create_fixed_session!(
          user: active_session.user,
          contribute: true,
          time: session_time,
          last_measurement_at:
            DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      dormant_stream =
        create_stream!(
          session: dormant_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
          sensor_name: 'Government-PM2.5',
        )
      daily_stream_average =
        create_stream_daily_average!(stream: active_stream)

      create_measurement!(stream: dormant_stream)

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
              sensor_name: active_stream.sensor_name.downcase,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'uuid' => active_session.uuid,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_measurement_value' => active_stream.average_value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'is_active' => active_session.is_active,
            'username' => active_session.user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' =>
                  active_stream.measurement_short_type,
                'sensor_name' => active_stream.sensor_name,
                'unit_symbol' => active_stream.unit_symbol,
                'id' => active_stream.id,
                'stream_daily_average' => daily_stream_average.value.round,
              },
            },
          },
        ],
      }

      expect(json_response).to eq(expected)
    end

    it 'with multiple streams it picks the correct stream' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
        )
      stream_1 =
        create_stream!(
          sensor_name: 'aaa',
          session: session,
          latitude: session.latitude,
          longitude: session.longitude,
        )
      create_measurement!(stream: stream_1)
      stream_2 =
        create_stream!(
          sensor_name: 'bbb',
          session: session,
          latitude: session.latitude,
          longitude: session.longitude,
        )
      create_measurement!(stream: stream_2)
      queried_stream = [stream_1, stream_2].sample

      stream_daily_average =
        create_stream_daily_average!(stream: queried_stream)

      get :index2,
          params: {
            q: {
              time_from:
                session_time.to_datetime.strftime('%Q').to_i / 1_000 - 1,
              time_to: session_time.to_datetime.strftime('%Q').to_i / 1_000 + 1,
              tags: '',
              usernames: '',
              session_ids: [],
              west: session.longitude - 1,
              east: session.longitude + 1,
              south: session.latitude - 1,
              north: session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: queried_stream.sensor_name,
              measurement_type: queried_stream.measurement_type,
              unit_symbol: queried_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => session.id,
            'uuid' => session.uuid,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_measurement_value' => queried_stream.average_value,
            'is_indoor' => session.is_indoor,
            'latitude' => session.latitude,
            'longitude' => session.longitude,
            'title' => session.title,
            'username' => session.user.username,
            'is_active' => session.is_active,
            'streams' => {
              queried_stream.sensor_name => {
                'measurement_short_type' =>
                  queried_stream.measurement_short_type,
                'sensor_name' => queried_stream.sensor_name,
                'unit_symbol' => queried_stream.unit_symbol,
                'id' => queried_stream.id,
                'stream_daily_average' => stream_daily_average.value.round,
              },
            },
          },
        ],
      }

      expect(json_response).to eq(expected)
    end
  end

  private

  def create_user!
    User.create!(
      username: 'username',
      email: 'email@example.com',
      password: 'password',
    )
  end

  def create_fixed_session!(
    user: create_user!,
    time:,
    contribute:,
    latitude: 123,
    longitude: 123,
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

  def create_stream!(session:, latitude:, longitude:, sensor_name: 'AirBeam2-F')
    threshold_set = ThresholdSet.create!(
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      unit_symbol: 'F',
      sensor_name: sensor_name,
    )

    Stream.create!(
      session: session,
      sensor_name: sensor_name,
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
      location: "SRID=4326;POINT(123 123)",
    )
  end
end
