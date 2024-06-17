class StreamSerializer
  def call(stream)
    update_frequency = stream.session.username == 'US EPA AirNow' ? '1 hour' : '1 minute'
    thresholds = Stream.thresholds(stream.sensor_name, stream.unit_symbol)

    {
      active: stream.session.is_active,
      title: stream.session.title,
      profile: stream.session.username,
      sensor_name: stream.sensor_name,
      unit_symbol: stream.unit_symbol,
      update_frequency: update_frequency,
      last_update: stream.session.last_measurement_at,
      session_id: stream.session.id,
      end_time: stream.session.end_time_local,
      start_time: stream.session.start_time_local,
      min: thresholds.threshold_very_low,
      low: thresholds.threshold_low,
      middle: thresholds.threshold_medium,
      high: thresholds.threshold_high,
      max: thresholds.threshold_very_high,
    }
  end
end
