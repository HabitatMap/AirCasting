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

  def cluster_averages(stream_ids:, end_of_last_time_slice:, time_period:)
    ActiveRecord::Base.connection.execute(
    <<~SQL
      SELECT date_trunc('hour', time_with_time_zone) AS hour, AVG(value) AS avg_value
      FROM measurements WHERE stream_id in (#{stream_ids.join(',')})
      AND time_with_time_zone >= '#{end_of_last_time_slice - time_period.days}'
      GROUP BY hour ORDER BY hour;
    SQL
  )
  end
end
