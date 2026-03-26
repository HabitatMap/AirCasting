class StationMeasurementsRepository
  def last_2_days(station_stream_id:)
    StationMeasurement
      .where(station_stream_id: station_stream_id)
      .where(
        "measured_at >= ((SELECT MAX(measured_at) FROM station_measurements WHERE station_stream_id = ?) - INTERVAL '2 days')",
        station_stream_id,
      )
      .order(:measured_at)
  end

  def filter(station_stream_id:, start_time:, end_time:)
    StationMeasurement
      .where(station_stream_id: station_stream_id)
      .where('measured_at >= ?', start_time)
      .where('measured_at <= ?', end_time)
      .order(:measured_at)
  end

  def streams_averages_hourly_last_7_days(station_stream_ids:)
    return [] if station_stream_ids.empty?

    end_date = Time.current.end_of_hour - 1.hour
    start_date = end_date.beginning_of_hour - 7.days

    conn = ActiveRecord::Base.connection
    quoted_ids = station_stream_ids.map { |id| conn.quote(id) }.join(', ')

    conn
      .execute(<<~SQL.squish)
        SELECT TO_CHAR(measured_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS +0000') AS hour,
               ROUND(AVG(value)::numeric)::float AS average_value
        FROM station_measurements
        WHERE station_stream_id IN (#{quoted_ids})
          AND measured_at >= #{conn.quote(start_date)}
          AND measured_at < #{conn.quote(end_date)}
        GROUP BY measured_at
        ORDER BY measured_at
      SQL
      .map { |record| { time: record['hour'], value: record['average_value'] } }
  end
end
