class FixedMeasurementsRepository
  def import(measurements:, on_duplicate_key_ignore:)
    FixedMeasurement.import(
      measurements,
      on_duplicate_key_ignore: on_duplicate_key_ignore,
    )
  end

  def last_2_days(stream_id:)
    FixedMeasurement
      .where(stream_id: stream_id)
      .where(
        "time_with_time_zone >= ((SELECT MAX(time_with_time_zone) FROM fixed_measurements WHERE stream_id = ?) - INTERVAL '2 days')",
        stream_id,
      )
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
        FROM fixed_measurements
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
