class SessionsRepository
  def find_with_streams(uuid:)
    Session.includes(streams: :threshold_set).find_by(uuid: uuid)
  end

  def active_in_last_7_days
    Session.where('last_measurement_at > ?', Time.current - 7.days)
  end

  def fixed_active_government_sessions(data)
    sensor_name = ActiveRecord::Base.connection.quote(data[:sensor_name])
    west = data[:west]
    east = data[:east]
    north = data[:north]
    south = data[:south]

    sql = <<-SQL
      SELECT s.*, st.*, sdavalue.value AS last_daily_average
      FROM sessions AS s
      JOIN streams AS st ON s.id = st.session_id
      LEFT JOIN (
          SELECT stream_id, value,
                 ROW_NUMBER() OVER (PARTITION BY stream_id ORDER BY date DESC) as rn
          FROM stream_daily_averages
      ) AS sdavalue ON st.id = sdavalue.stream_id AND sdavalue.rn = 1
      WHERE LOWER(st.sensor_name) = #{sensor_name}
        AND s.latitude BETWEEN #{south} AND #{north}
        AND s.longitude BETWEEN #{west} AND #{east}
        AND s.last_measurement_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';
    SQL

    ActiveRecord::Base.connection.execute(sql)
  end
end
