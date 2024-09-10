class FixedSessionsSerializer
  def call(sessions)
    sessions_array = []

    sessions.map do |session|
      sessions_array <<
        {
          'id' => session["session_id"],
          'uuid' => session["uuid"],
          'end_time_local' => session["end_time_local"]&.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
          'start_time_local' => session["start_time_local"]&.strftime('%Y-%m-%dT%H:%M:%S.%LZ'),
          'last_measurement_value' => session["average_value"]&.round,
          'is_indoor' => session["is_indoor"],
          'latitude' => session["latitude"],
          'longitude' => session["longitude"],
          'title' => session["title"],
          'username' => "username",
          'is_active' => true,
          'streams' => {
            session["sensor_name"] => {
              'measurement_short_type' => session["measurement_short_type"],
              'sensor_name' => session["sensor_name"],
              'unit_symbol' => session["unit_symbol"],
              'id' => session["id"],
              'stream_daily_average' => session["last_daily_average"]&.round || 'no data',
            }
          }
        }
    end

    {
      'fetchableSessionsCount' => sessions.count,
      'sessions' => sessions_array,
    }
  end
end
