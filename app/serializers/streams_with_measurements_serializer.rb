class StreamsWithMeasurementsSerializer
  def call(streams:)
    { streams: streams.map { |stream| serialized_stream(stream) } }
  end

  private

  def serialized_stream(stream)
    {
      id: stream.id,
      sensor_name: stream.sensor_name,
      sensor_package_name: stream.sensor_package_name,
      measurement_type: stream.measurement_type,
      measurements:
        stream.measurements.map do |measurement|
          {
            value: measurement.value,
            time: measurement.time.strftime('%Y-%m-%d %H:%M:%S'),
            latitude: measurement.latitude,
            longitude: measurement.longitude,
          }
        end,
    }
  end
end
