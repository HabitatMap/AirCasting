class FixedStreamSerializer
  def call(stream:, measurements:, stream_daily_averages:)
    {
      stream: serialized_stream(stream),
      measurements: serialized_measurements(measurements),
      stream_daily_averages:
        serialized_stream_daily_averages(stream_daily_averages),
    }
  end

  private

  def serialized_stream(stream)
    thresolds = Stream.thresholds(stream.sensor_name, stream.unit_symbol)

    {
      id: stream.id,
      session_id: stream.session.id,
      active: stream.session.is_active,
      title: stream.session.title,
      profile: stream.session.username,
      sensor_name: stream.sensor_name,
      unit_symbol: stream.unit_symbol,
      update_frequency: '1 minute',
      last_update: stream.session.last_measurement_at,
      min: thresolds[0],
      low: thresolds[1],
      middle: thresolds[2],
      high: thresolds[3],
      max: thresolds[4],
    }
  end

  def serialized_measurements(measurements)
    measurements.map do |measurement|
      { time: measurement.time.to_i * 1_000, value: measurement.value }
    end
  end

  def serialized_stream_daily_averages(stream_daily_averages)
    stream_daily_averages.map do |stream_daily_average|
      {
        date: stream_daily_average.date.strftime('%Y-%m-%d'),
        value: stream_daily_average.value.round,
      }
    end
  end
end
