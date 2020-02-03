class OpenAq::GroupByStream
  def call(measurements:)
    measurements.reduce({}) do |acc, measurement|
      key = build_stream(measurement)
      previous = acc.key?(key) ? acc[key] : []
      acc.merge(key => previous + [measurement])
    end.transform_values { |values| values.sort_by(&:time_utc) }
  end

  private

  def build_stream(measurement)
    OpenAq::Stream.new(
      latitude: measurement.latitude,
      longitude: measurement.longitude,
      sensor_name: measurement.sensor_name
    )
  end
end
