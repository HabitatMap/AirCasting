require 'rails_helper'

describe Api::Fixed::StreamsController do
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

      get :show, params: { id: stream.id }

      expected = {
        'title' => title,
        'username' => username,
        'sensor_name' => sensor_name,
        'start_time' => 970_365_780_000,
        'end_time' => 1_004_850_360_000,
        'id' => session.id,
        'stream_id' => stream.id,
        'is_indoor' => false,
        'last_measurement_value' => stream.average_value,
        'latitude' => 123.0,
        'longitude' => 123.0,
        'max_latitude' => 1.0,
        'max_longitude' => 1.0,
        'measurements' => [
          {
            'latitude' => 1.0,
            'longitude' => 1.0,
            'time' => start_time_local.to_i * 1_000,
            'value' => 123.0
          }
        ],
        'min_latitude' => 1.0,
        'min_longitude' => 1.0,
        'notes' => [],
        'sensor_unit' => 'F',
        'threshold_very_low' => 20,
        'threshold_low' => 60,
        'threshold_medium' => 70,
        'threshold_high' => 80,
        'threshold_very_high' => 100,
        'unit_name' => 'Fahrenheit',
        'measurement_short_type' => 'F',
        'measurement_type' => 'Temperature',
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
end
