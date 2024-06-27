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

  def cluster_averages(time_period:, stream_ids:, end_of_last_time_slice:)
    interval =
      case time_period
      when 1 then '1 hour'
      when 3 then '3 hours'
      when 7 then '7 hours'
      end

    ActiveRecord::Base.connection.execute(
    <<~SQL
      WITH time_slices AS (
        SELECT generate_series(
          date_trunc('hour', '#{end_of_last_time_slice - time_period.days}'::timestamp),
          '#{end_of_last_time_slice}'::timestamp - interval '#{interval}',
          interval '#{interval}'
        ) AS slice
      )
      SELECT slice, AVG(value) AS avg_value
      FROM time_slices
      LEFT JOIN measurements ON date_trunc('hour', measurements.time_with_time_zone) >= slice
                              AND date_trunc('hour', measurements.time_with_time_zone) < slice + interval '#{interval}'
      WHERE stream_id IN (#{stream_ids.join(',')})
      GROUP BY slice
      ORDER BY slice
    SQL
  )
  end
end
