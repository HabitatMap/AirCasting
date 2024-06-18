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

  def stream_average_from_period(stream_id:, start_date:, end_date:)
    Measurement
      .where(
        'stream_id = ? AND time_with_time_zone >= ? AND time_with_time_zone < ?',
        stream_id,
        start_date,
        end_date,
      )
      .average(:value)
  end
end
