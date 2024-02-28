class MeasurementsRepository
  def from_last_24_hours(stream_id:)
    Measurement.where(stream_id: stream_id).reorder(time: :desc).limit(1440)
  end

  def stream_daily_average_value(stream_id:, beginning_of_day:)
    Measurement
      .where(
        'stream_id = ? AND time_with_time_zone >= ?',
        stream_id,
        beginning_of_day,
      )
      .average(:value)
  end
end
