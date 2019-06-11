class MobileSession < Session
  def as_synchronizable(stream_measurements)
    as_json(methods: %i[streams], stream_measurements: stream_measurements)
  end

  def self.filtered_json_fields
    %i[id title start_time_local end_time_local]
  end

  def fixed?
    false
  end

  def generate_link(stream)
    data = {
      sensorId: stream.sensor_id,
      usernames: user.username,
      heat: {
        highest: stream.threshold_very_high,
        high: stream.threshold_high,
        mid: stream.threshold_medium,
        low: stream.threshold_low,
        lowest: stream.threshold_very_low
      }
    }

    Rails.application.routes.url_helpers.mobile_map_path(
      anchor: "?selectedSessionIds=#{[id].to_json}&data=#{data.to_json}"
    )
  end
end
