class SessionSerializer
  def call(session)
    {
      id: session.id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      user_id: session.user_id,
      uuid: session.uuid,
      url_token: session.url_token,
      title: session.title,
      contribute: session.contribute,
      start_time_local: session.start_time_local,
      end_time_local: session.end_time_local,
      is_indoor: session.is_indoor,
      latitude: session.latitude,
      longitude: session.longitude,
      last_measurement_at: session.last_measurement_at,
      version: session.version,
      time_zone: session.time_zone,
      tag_list: session.tag_list,
      type: session.type,
      streams: session.streams.each_with_object({}) do |stream, hash|
        hash[stream.sensor_name] = {
          id: stream.id,
          sensor_name: stream.sensor_name,
          unit_name: stream.unit_name,
          measurement_type: stream.measurement_type,
          measurement_short_type: stream.measurement_short_type,
          unit_symbol: stream.unit_symbol,
          threshold_very_low: stream.threshold_set.threshold_very_low,
          threshold_low: stream.threshold_set.threshold_low,
          threshold_high: stream.threshold_set.threshold_high,
          threshold_very_high: stream.threshold_set.threshold_very_high,
          threshold_medium: stream.threshold_set.threshold_medium,
          session_id: stream.session_id,
          sensor_package_name: stream.sensor_package_name,
          measurements_count: stream.measurements_count,
          min_latitude: stream.min_latitude,
          max_latitude: stream.max_latitude,
          min_longitude: stream.min_longitude,
          max_longitude: stream.max_longitude,
          average_value: stream.average_value,
          start_longitude: stream.start_longitude,
          start_latitude: stream.start_latitude,
          size: stream.size,
          measurements: stream.measurements.map do |measurement|
            {
              id: measurement.id,
              value: measurement.value,
              latitude: measurement.latitude,
              longitude: measurement.longitude,
              time: measurement.time,
              stream_id: measurement.stream_id,
              milliseconds: measurement.milliseconds,
              measured_value: measurement.measured_value,
              location: measurement.location.to_s,
              time_with_time_zone: measurement.time_with_time_zone,
            }
          end
        }
      end
    }
  end
end
