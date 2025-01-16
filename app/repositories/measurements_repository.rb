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

  def streams_averages_hourly_last_7_days(stream_ids:, with_hour_shift:)
    end_date = Time.current.end_of_hour - 1.hour
    start_date = end_date.beginning_of_hour - 7.days

    hour_selection =
      if with_hour_shift
        "(DATE_TRUNC('hour', time_with_time_zone) + INTERVAL '1 hour')"
      else
        "DATE_TRUNC('hour', time_with_time_zone)"
      end

    ActiveRecord::Base
      .connection
      .execute(
        "
        SELECT #{hour_selection} AS hour, AVG(value) AS average_value
        FROM measurements
        WHERE stream_id IN (#{stream_ids.join(',')})
        AND time_with_time_zone >= '#{start_date}'
        AND time_with_time_zone < '#{end_date}'
        GROUP BY hour
        ORDER BY hour
      ",
      )
      .map { |record| { time: record['hour'], value: record['average_value'] } }
  end
end
