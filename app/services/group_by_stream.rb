class GroupByStream
  def call(measurements:)
    measurements
      .each_with_object({}) do |measurement, acc|
        key = measurement.build_stream
        previous = acc.key?(key) ? acc[key] : []
        acc[key] = previous + [measurement]
      end
      .transform_values { |values| values.sort_by(&:time_with_time_zone) }
  end
end
