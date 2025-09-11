require 'rails_helper'

describe Api::Fixed::SessionsController do
  describe '#show_all_streams' do
    it 'returns session json including all streams' do
      username = 'username'
      title = 'session title'
      user = create_user!(username: username)
      start_time_local = DateTime.new(2_000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2_001, 11, 4, 5, 6)
      session =
        create_fixed_session!(
          user: user,
          title: title,
          start_time_local: start_time_local,
          end_time_local: end_time_local,
        )
      stream = create_stream!(session: session, sensor_name: 'sensor-name')
      other_stream =
        create_stream!(session: session, sensor_name: 'yet another-sensor-name')
      create(
        :fixed_measurement,
        stream: stream,
        value: 123.0,
        time: start_time_local,
      )
      create(
        :fixed_measurement,
        stream: other_stream,
        value: 123.0,
        time: start_time_local,
      )

      get :show_all_streams, params: { id: session.id }

      expected = {
        'id' => session.id,
        'title' => title,
        'username' => username,
        'start_time' => 970_365_780_000,
        'end_time' => 1_004_850_360_000,
        'latitude' => 123.0,
        'longitude' => 123.0,
        'notes' => [],
        'is_indoor' => false,
        'streams' => [
          {
            'stream_id' => stream.id,
            'sensor_name' => stream.sensor_name,
            'last_measurement_value' => stream.average_value,
            'max_latitude' => 1.0,
            'max_longitude' => 1.0,
            'measurements' => [
              {
                'time' => start_time_local.to_i * 1_000,
                'value' => 123.0,
                'latitude' => 123,
                'longitude' => 123,
              },
            ],
            'min_latitude' => 1.0,
            'min_longitude' => 1.0,
            'sensor_unit' => 'F',
            'threshold_very_low' => 20,
            'threshold_low' => 60,
            'threshold_medium' => 70,
            'threshold_high' => 80,
            'threshold_very_high' => 100,
            'unit_name' => 'Fahrenheit',
            'measurement_short_type' => 'F',
            'measurement_type' => 'Temperature',
          },
          {
            'stream_id' => other_stream.id,
            'sensor_name' => other_stream.sensor_name,
            'last_measurement_value' => other_stream.average_value,
            'max_latitude' => 1.0,
            'max_longitude' => 1.0,
            'measurements' => [
              {
                'time' => start_time_local.to_i * 1_000,
                'value' => 123.0,
                'latitude' => 123,
                'longitude' => 123,
              },
            ],
            'min_latitude' => 1.0,
            'min_longitude' => 1.0,
            'sensor_unit' => 'F',
            'threshold_very_low' => 20,
            'threshold_low' => 60,
            'threshold_medium' => 70,
            'threshold_high' => 80,
            'threshold_very_high' => 100,
            'unit_name' => 'Fahrenheit',
            'measurement_short_type' => 'F',
            'measurement_type' => 'Temperature',
          },
        ],
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
      start_time_local: attr.fetch(:start_time_local, DateTime.current),
      end_time_local: attr.fetch(:end_time_local, DateTime.current),
      is_indoor: false,
      latitude: 123,
      longitude: 123,
    )
  end

  def format_time(time)
    time.strftime('%FT%T.000Z')
  end
end
