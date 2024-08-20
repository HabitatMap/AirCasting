class MeasurementsRepository
  def from_last_24_hours(stream_id:)
    Measurement.where(stream_id: stream_id).reorder(time: :desc).limit(1440)
  end

  def stream_daily_average_value(stream_id:, time_with_time_zone:)
    Measurement
      .where(
        'stream_id = ? AND time_with_time_zone >= ? AND time_with_time_zone <= ?',
        stream_id,
        time_with_time_zone.beginning_of_day,
        time_with_time_zone.end_of_day,
      )
      .average(:value)
  end

  def streams_averages_from_period(stream_ids:, start_date:, end_date:)
    ActiveRecord::Base.connection.execute(
      "
        SELECT (DATE_TRUNC('hour', time_with_time_zone) + INTERVAL '1 hour') AS hour, AVG(value) AS average_value
        FROM measurements
        WHERE stream_id IN (#{stream_ids.join(',')})
        AND time_with_time_zone >= '#{start_date}'
        AND time_with_time_zone < '#{end_date}'
        GROUP BY hour
        ORDER BY hour
      "
    ).map { |record| { time: record['hour'], value: record['average_value'] } }
  end

  def stream_average_from_period(stream_id:, start_date:, end_date:)
    result = ActiveRecord::Base.connection.execute(
      "
        SELECT AVG(value) AS average_value
        FROM measurements
        WHERE stream_id = #{stream_id}
        AND time_with_time_zone >= '#{start_date}'
        AND time_with_time_zone < '#{end_date}'
      "
    ).first

    result['average_value'] ? result['average_value'].to_f : nil
  end

  def stream_averages_from_period(stream_id:, start_date:, end_date:)
    ActiveRecord::Base.connection.execute(
      "
        SELECT (DATE_TRUNC('hour', time_with_time_zone) + INTERVAL '1 hour') AS hour, AVG(value) AS average_value
        FROM measurements
        WHERE stream_id = #{stream_id}
        AND time_with_time_zone >= '#{start_date}'
        AND time_with_time_zone < '#{end_date}'
        GROUP BY hour
        ORDER BY hour
      "
    ).map { |record| { time: record['hour'], value: record['average_value'] } }
  end
end
