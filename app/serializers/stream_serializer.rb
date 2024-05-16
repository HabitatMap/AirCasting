class StreamSerializer
  def call(stream, default_thresholds)
    {
      active: stream.session.is_active,
      title: stream.session.title,
      profile: stream.session.username,
      sensor_name: stream.sensor_name,
      unit_symbol: stream.unit_symbol,
      update_frequency: '1 minute',
      last_update: stream.session.last_measurement_at,
      session_id: stream.session.id,
      thresholds: {
        min: default_thresholds&.threshold_very_low || stream.threshold_very_low,
        low: default_thresholds&.threshold_low || stream.threshold_low,
        middle: default_thresholds&.threshold_medium || stream.threshold_medium,
        high: default_thresholds&.threshold_high || stream.threshold_high,
        max: default_thresholds&.threshold_very_high || stream.threshold_very_high,
      },
    }
  end
end
