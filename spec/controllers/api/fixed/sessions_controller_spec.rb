require 'rails_helper'

describe Api::Fixed::SessionsController do
  describe '#show' do
    it 'returns session json' do
      username = 'username'
      title = 'session title'
      start_time_local = DateTime.new(2_000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2_001, 11, 4, 5, 6)
      sensor_name = 'sensor-name'
      user = create_user!(username: username)
      session =
        create_fixed_session!(
          user: user,
          title: title,
          start_time_local: start_time_local,
          end_time_local: end_time_local
        )
      create_stream!(session: session, sensor_name: 'another-sensor-name')
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_stream!(session: session, sensor_name: 'yet another-sensor-name')
      create_measurement!(stream: stream, time: start_time_local)

      get :show, params: { id: session.id, sensor_name: sensor_name }

      expected = {
        'title' => title,
        'username' => username,
        'sensorName' => sensor_name,
        'startTime' => 970_365_780_000,
        'endTime' => 1_004_850_360_000,
        'id' => session.id,
        'streamId' => stream.id,
        'isIndoor' => false,
        'lastMeasurementValue' => stream.average_value,
        'latitude' => 123.0,
        'longitude' => 123.0,
        'maxLatitude' => 1.0,
        'maxLongitude' => 1.0,
        'measurements' => [
          {
            'latitude' => 1.0,
            'longitude' => 1.0,
            'time' => start_time_local.to_i * 1_000,
            'value' => 123.0
          }
        ],
        'minLatitude' => 1.0,
        'minLongitude' => 1.0,
        'notes' => [],
        'sensorUnit' => 'F'
      }
      expect(json_response).to eq(expected)
    end
  end

  describe '#show2' do
    it 'returns session json including stream' do
      sensor_name = 'sensor-name'
      user = create_user!({ username: 'username' })
      session = create_fixed_session!(user: user)
      create_stream!(session: session, sensor_name: 'another-sensor-name')
      stream = create_stream!(session: session, sensor_name: sensor_name)
      create_measurements!({ stream: stream, value: 1 })

      get :show2, params: { id: session.id, sensor_name: sensor_name }

      expected = {
        'title' => session.title,
        'id' => session.id,
        'contribute' => session.contribute,
        'created_at' => format_time(session.created_at),
        'data_type' => nil,
        'end_time' => format_time(session.end_time),
        'end_time_local' => format_time(session.end_time_local),
        'instrument' => nil,
        'is_indoor' => session.is_indoor,
        'last_measurement_at' => nil,
        'latitude' => session.latitude,
        'longitude' => session.longitude,
        'measurements_count' => nil,
        'start_time' => format_time(session.start_time),
        'start_time_local' => format_time(session.start_time_local),
        'type' => 'FixedSession',
        'updated_at' => format_time(session.updated_at),
        'url_token' => session.url_token,
        'user_id' => user.id,
        'uuid' => session.uuid,
        'last_measurement_value' => stream.average_value,
        'streams' => {
          stream.sensor_name => {
            'average_value' => stream.average_value,
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
            'unit_symbol' => stream.unit_symbol
          }
        }
      }
      expect(json_response).to eq(expected)
    end
  end

  private

  def create_fixed_session!(attr)
    FixedSession.create!(
      title: attr.fetch(:title, 'title'),
      user: attr.fetch(:user),
      uuid: SecureRandom.uuid,
      start_time: DateTime.current,
      start_time_local: attr.fetch(:start_time_local, DateTime.current),
      end_time: DateTime.current,
      end_time_local: attr.fetch(:end_time_local, DateTime.current),
      is_indoor: false,
      latitude: 123,
      longitude: 123
    )
  end

  def format_time(time)
    time.strftime('%FT%T.000Z')
  end
end
