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
        SELECT s.id, m.location, s.last_measurement_at, s.end_time_local, s.start_time_local, s.is_indoor, s.title, s.uuid
        FROM sessions s
        JOIN streams st ON s.id = st.session_id
        JOIN measurements m ON st.id = m.stream_id
        WHERE s.last_measurement_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          AND m.time = s.last_measurement_at
          AND (
            CASE
              WHEN #{west} <= #{east} THEN
                ST_Intersects(m.location, ST_MakeEnvelope(#{west}, #{south}, #{east}, #{north}, 4326))
              ELSE
                ST_Intersects(m.location, ST_MakeEnvelope(#{west}, #{south}, 180, #{north}, 4326))
                OR
                ST_Intersects(m.location, ST_MakeEnvelope(-180, #{south}, #{east}, #{north}, 4326))
            END
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
