class SessionsRepository
  def find_with_streams(uuid:)
    Session.includes(streams: :threshold_set).find_by(uuid: uuid)
  end

  def active_in_last_7_days
    Session.where('last_measurement_at > ?', Time.current - 7.days)
  end

  def fixed_active_government_sessions(
    sensor_name:,
    west:,
    east:,
    north:,
    south:
  )
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
          AND session_id IN (SELECT id FROM recent_sessions)
      ),
      latest_daily_averages AS (
        SELECT DISTINCT ON (stream_id) stream_id, value
        FROM stream_daily_averages
        WHERE stream_id IN (SELECT id FROM relevant_streams)
        ORDER BY stream_id, date DESC
      )
      SELECT s.*, st.*, lda.value AS last_daily_average
      FROM recent_sessions s
      JOIN relevant_streams st ON s.id = st.session_id
      LEFT JOIN latest_daily_averages lda ON st.id = lda.stream_id;
    SQL

    ActiveRecord::Base.connection.execute(sql)
  end

  def filter(params:)
    current_time = DateTime.current

    start_datetime =
      params[:start_datetime] || current_time.beginning_of_day - 30.days
    end_datetime = params[:end_datetime] || current_time.end_of_day

    query =
      Session
        .includes(:streams)
        .joins(:streams)
        .where(
          'sessions.start_time_local >= ? AND sessions.start_time_local <= ?',
          start_datetime,
          end_datetime,
        )

    query = with_tags(query, params[:tags]) if params[:tags].present?
    query =
      with_sensor_package_name(query, params[:sensor_package_name]) if params[
      :sensor_package_name
    ].present?

    query
  end

  private

  def with_tags(query, tags)
    query.tagged_with(tags, any: true)
  end

  def with_sensor_package_name(query, sensor_package_name)
    query.where('streams.sensor_package_name = ?', sensor_package_name)
  end
end
