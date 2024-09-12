class SessionsRepository
  def find_with_streams(uuid:)
    Session.includes(streams: :threshold_set).find_by(uuid: uuid)
  end

  def active_in_last_7_days
    Session.where('last_measurement_at > ?', Time.current - 7.days)
  end

  def fixed_active_government_sessions(sensor_name:, west:, east:, north:, south:)
    sensor_name = ActiveRecord::Base.connection.quote(sensor_name)

    sql = <<-SQL
      WITH recent_sessions AS (
        SELECT id, latitude, longitude, last_measurement_at, end_time_local, start_time_local, is_indoor, title, uuid
        FROM sessions
        WHERE last_measurement_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          AND latitude BETWEEN #{south} AND #{north}
          AND (
            (#{west} <= #{east} AND longitude BETWEEN #{west} AND #{east})
            OR
            (#{west} > #{east} AND (longitude >= #{west} OR longitude <= #{east}))
          )
      ),
      relevant_streams AS (
        SELECT id, session_id, sensor_name, unit_symbol, measurement_short_type, average_value
        FROM streams
        WHERE LOWER(sensor_name) = #{sensor_name}
      ),
      latest_daily_averages AS (
        SELECT DISTINCT ON (stream_id) stream_id, value
        FROM stream_daily_averages
        ORDER BY stream_id, date DESC
      )
      SELECT s.*, st.*, lda.value AS last_daily_average
      FROM recent_sessions s
      JOIN relevant_streams st ON s.id = st.session_id
      LEFT JOIN latest_daily_averages lda ON st.id = lda.stream_id;
    SQL

    ActiveRecord::Base.connection.execute(sql)
  end
end
