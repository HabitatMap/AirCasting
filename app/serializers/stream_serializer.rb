class StreamSerializer
  def call(stream)
    {
      active: stream.session.is_active,
      title: stream.session.title,
      profile: stream.session.username,
      sensor_name: stream.sensor_name,
      unit_symbol: stream.unit_symbol,
      update_frequency: '1 minute',
      last_update: stream.session.last_measurement_at,
      session_id: stream.session.id,
    }
  end
end
