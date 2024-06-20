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
    sql = "
      SELECT AVG(value) AS average_value
      FROM measurements
      WHERE stream_id IN (#{stream_ids.join(',')})
      AND time_with_time_zone >= '#{start_date}'
      AND time_with_time_zone < '#{end_date}'
    "

    average_value = ActiveRecord::Base.connection.execute(sql).first['average_value']
  end
end
