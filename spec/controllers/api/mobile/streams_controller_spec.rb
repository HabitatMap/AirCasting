require 'rails_helper'

describe Api::Mobile::StreamsController do
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

      get :show, params: { id: stream.id }

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
    start_time_local: DateTime.current,
    end_time_local: DateTime.current
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
      time: DateTime.current,
      latitude: 123,
      longitude: 123,
      value: 1.0,
      milliseconds: 123,
      stream: stream,
      location: "SRID=4326;POINT(123 123)",
    )
  end

  def format_time_to_i(time)
    time.to_datetime.strftime('%Q').to_i
  end
end
