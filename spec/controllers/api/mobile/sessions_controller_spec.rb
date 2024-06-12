require 'rails_helper'

describe Api::Mobile::SessionsController do
  describe '#index' do
    it 'returns sessions json' do
      user = create_user!
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      session =
        create_mobile_session!(
          user: user,
          start_time_local: session_time,
          end_time_local: session_time,
        )
      stream =
        create_stream!(
          session: session,
          latitude: session.latitude,
          longitude: session.longitude,
        )
      measurement = create_measurement!(stream: stream)

      get :index,
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
              limit: 1,
              offset: 0,
              sensor_name: stream.sensor_name,
              measurement_type: stream.measurement_type,
              unit_symbol: stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          'end_time_local' => '2000-10-01T02:03:04.000Z',
          'start_time_local' => '2000-10-01T02:03:04.000Z',
          'id' => session.id,
          'title' => session.title,
          'type' => session.type,
          'username' => user.username,
          'streams' => {
            stream.sensor_name => {
              'average_value' => stream.average_value.round,
              'id' => stream.id,
              'max_latitude' => stream.max_latitude,
              'max_longitude' => stream.max_longitude,
              'measurement_short_type' => stream.measurement_short_type,
              'measurement_type' => stream.measurement_type,
              'measurements_count' => 1,
              'min_latitude' => stream.min_latitude,
              'min_longitude' => stream.min_longitude,
              'sensor_name' => stream.sensor_name,
              'sensor_package_name' => stream.sensor_package_name,
              'session_id' => session.id,
              'size' => 1,
              'start_latitude' => stream.start_latitude,
              'start_longitude' => stream.start_longitude,
              'threshold_high' => stream.threshold_high,
              'threshold_low' => stream.threshold_low,
              'threshold_medium' => stream.threshold_medium,
              'threshold_very_high' => stream.threshold_very_high,
              'threshold_very_low' => stream.threshold_very_low,
              'unit_name' => stream.unit_name,
              'unit_symbol' => stream.unit_symbol,
            },
          },
        ],
      }
      expect(json_response).to eq(expected)
    end
  end

  describe '#show' do
    it 'returns session json including measurements' do
      start_time_local = DateTime.new(2_000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2_001, 11, 4, 5, 6)
      sensor_name = 'sensor-name'
      user = create_user!
      session =
        create_mobile_session!(
          user: user,
          start_time_local: start_time_local,
          end_time_local: end_time_local,
        )
      create_stream!(session: session, sensor_name: 'another-sensor-name')
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_stream!(session: session, sensor_name: 'yet another-sensor-name')
      measurement1 = create_measurement!(stream: stream)
      measurement2 = create_measurement!(stream: stream)

      get :show, params: { id: session.id, sensor_name: sensor_name }

      expected = {
        'title' => session.title,
        'username' => user.username,
        'sensorName' => sensor_name,
        'startTime' => 970_365_780_000,
        'endTime' => 1_004_850_360_000,
        'id' => session.id,
        'streamId' => stream.id,
        'sensorUnit' => stream.unit_symbol,
        'maxLatitude' => 123.0,
        'maxLongitude' => 123.0,
        'measurements' => [
          {
            'value' => measurement1.value,
            'time' => format_time_to_i(measurement1.time),
            'longitude' => measurement1.longitude,
            'latitude' => measurement1.latitude,
          },
          {
            'value' => measurement2.value,
            'time' => format_time_to_i(measurement2.time),
            'longitude' => measurement2.longitude,
            'latitude' => measurement2.latitude,
          },
        ],
        'minLatitude' => 123.0,
        'minLongitude' => 123.0,
        'notes' => [],
        'averageValue' => 1.23.round,
        'startLatitude' => 123.0,
        'startLongitude' => 123.0,
      }
      expect(json_response).to eq(expected)
    end
  end

  describe '#show2' do
    it 'returns session json including stream and measurements' do
      sensor_name = 'sensor-name'
      user = create_user!
      session = create_mobile_session!(user: user)
      create_stream!(session: session, sensor_name: 'another-sensor-name')
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_stream!(session: session, sensor_name: 'yet another-sensor-name')
      measurement1 = create_measurement!(stream: stream)
      measurement2 = create_measurement!(stream: stream)
      note = create_note!(session: session)

      # For whatever reasons w/o the reloads date on notes and times on measurements
      # are off by one second.
      note.reload
      measurement1.reload
      measurement2.reload

      get :show2, params: { id: session.id, sensor_name: sensor_name }

      expected = {
        'title' => session.title,
        'average' => (measurement1.value + measurement2.value) / 2,
        'id' => session.id,
        'contribute' => session.contribute,
        'created_at' => format_time(session.created_at),
        'end_time_local' => format_time(session.end_time_local),
        'is_indoor' => session.is_indoor,
        'last_measurement_at' => nil,
        'latitude' => session.latitude,
        'longitude' => session.longitude,
        'start_time_local' => format_time(session.start_time_local),
        'type' => 'MobileSession',
        'updated_at' => format_time(session.updated_at),
        'url_token' => session.url_token,
        'user_id' => user.id,
        'uuid' => session.uuid,
        'notes' => [
          {
            'created_at' => format_time_with_miliseconds(note.created_at),
            'date' => format_time(note.date),
            'id' => note.id,
            'latitude' => note.latitude,
            'longitude' => note.longitude,
            'number' => note.number,
            'photo_content_type' => note.photo_content_type,
            'photo_file_name' => note.photo_file_name,
            'photo_file_size' => note.photo_file_size,
            'photo_updated_at' => note.photo_updated_at,
            'session_id' => session.id,
            'text' => note.text,
            'updated_at' => format_time_with_miliseconds(note.updated_at)
          }
        ],
        'streams' => {
          stream.sensor_name => {
            'average_value' => stream.average_value,
            'id' => stream.id,
            'max_latitude' => stream.max_latitude,
            'max_longitude' => stream.max_longitude,
            'measurement_short_type' => stream.measurement_short_type,
            'measurement_type' => stream.measurement_type,
            'measurements_count' => 2,
            'min_latitude' => stream.min_latitude,
            'min_longitude' => stream.min_longitude,
            'sensor_name' => stream.sensor_name,
            'sensor_package_name' => stream.sensor_package_name,
            'session_id' => session.id,
            'size' => 2,
            'start_latitude' => stream.start_latitude,
            'start_longitude' => stream.start_longitude,
            'threshold_high' => stream.threshold_high,
            'threshold_low' => stream.threshold_low,
            'threshold_medium' => stream.threshold_medium,
            'threshold_very_high' => stream.threshold_very_high,
            'threshold_very_low' => stream.threshold_very_low,
            'unit_name' => stream.unit_name,
            'unit_symbol' => stream.unit_symbol,
            'measurements' => [
              {
                'value' => measurement1.value,
                'latitude' => measurement1.latitude,
                'longitude' => measurement1.longitude,
                'time' => format_time(measurement1.time)
              },
              {
                'value' => measurement2.value,
                'latitude' => measurement2.latitude,
                'longitude' => measurement2.longitude,
                'time' => format_time(measurement2.time)
              },
            ],
          },
        },
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

  def create_mobile_session!(
    user:,
    start_time_local: DateTime.current.change(:usec => 0),
    end_time_local: DateTime.current.change(:usec => 0)
  )
    MobileSession.create!(
      title: 'title',
      user: user,
      uuid: SecureRandom.uuid,
      start_time_local: start_time_local,
      end_time_local: end_time_local,
      latitude: 123,
      longitude: 123,
      contribute: true,
    )
  end

  def create_stream!(
    session:,
    sensor_name: 'sensor_name',
    latitude: 123,
    longitude: 123
  )
    Stream.create!(
      sensor_package_name: 'abc',
      sensor_name: sensor_name,
      measurement_type: 'abc',
      unit_name: 'abc',
      session: session,
      measurement_short_type: 'dB',
      unit_symbol: 'dB',
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100,
      start_latitude: 123,
      start_longitude: 123,
      average_value: 1.23,
      min_latitude: latitude,
      max_latitude: latitude,
      min_longitude: longitude,
      max_longitude: longitude,
    )
  end

  def create_measurement!(stream:)
    Measurement.create!(
      time: DateTime.current.change(:usec => 0),
      latitude: 123,
      longitude: 123,
      value: 1.0,
      milliseconds: 123,
      stream: stream,
      location: "SRID=4326;POINT(123 123)",
    )
  end

  def create_note!(session:)
    Note.create!(
      text: 'text',
      date: DateTime.current.change(:usec => 0),
      latitude: 123,
      longitude: 123,
      session: session,
    )
  end

  def format_time(time)
    time.strftime('%FT%T.000Z')
  end

  def format_time_to_i(time)
    time.to_datetime.strftime('%Q').to_i
  end

  def format_time_with_miliseconds(time)
    time.strftime('%FT%T.%LZ')
  end
end
