class StationStreamsSerializer
  def call(station_streams)
    sessions =
      station_streams.map do |stream|
        {
          'id' => stream.id,
          'uuid' => stream.uuid,
          'end_time_local' => formatted_time(stream.last_measured_at),
          'start_time_local' => formatted_time(stream.first_measured_at),
          'last_measurement_value' => stream.last_measurement_value&.round,
          'is_indoor' => false,
          'latitude' => stream.location.y,
          'longitude' => stream.location.x,
          'title' => stream.title,
          'username' => 'Government',
          'is_active' => true,
          'streams' => build_streams(stream),
        }
      end

    { 'fetchableSessionsCount' => sessions.count, 'sessions' => sessions }
  end

  private

  def build_streams(stream)
    config = stream.stream_configuration
    sensor_name = "Government-#{config.measurement_type}"

    {
      sensor_name => {
        'measurement_short_type' => config.measurement_type,
        'sensor_name' => sensor_name,
        'unit_symbol' => config.unit_symbol,
        'id' => stream.id,
      },
    }
  end

  def formatted_time(timestamp)
    timestamp&.strftime('%Y-%m-%dT%H:%M:%S.%LZ')
  end
end
