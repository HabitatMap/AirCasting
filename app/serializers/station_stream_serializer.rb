class StationStreamSerializer
  def call(station_stream)
    config = station_stream.stream_configuration
    tz = station_stream.time_zone

    {
      active: station_stream.is_active,
      title: station_stream.title,
      latitude: station_stream.location.y,
      longitude: station_stream.location.x,
      profile: station_stream.source.full_name,
      sensor_name: "Government-#{config.measurement_type}",
      unit_symbol: config.unit_symbol,
      update_frequency: '1 hour',
      last_update: Utils.to_local_as_utc(station_stream.last_measured_at, tz),
      session_id: station_stream.id,
      start_time: Utils.to_local_as_utc(station_stream.first_measured_at, tz),
      end_time: Utils.to_local_as_utc(station_stream.last_measured_at, tz),
      min: config.threshold_very_low,
      low: config.threshold_low,
      middle: config.threshold_medium,
      high: config.threshold_high,
      max: config.threshold_very_high,
    }
  end
end
