class StreamDailyAveragesRepository
  def from_full_last_3_calendar_months(stream_id:)
    start_date = Date.current.prev_month(3).beginning_of_month

    StreamDailyAverage
      .where(stream_id: stream_id)
      .where('date >= ?', start_date)
  end

  def from_time_range(stream_id:, start_date:, end_date:)
    StreamDailyAverage
      .where(stream_id: stream_id)
      .where('date >= ? AND date <= ?', start_date, end_date)
  end

  def last_average_value(stream_id)
    last_daily_average = StreamDailyAverage
                          .where(stream_id: stream_id)
                          .order(date: :desc)
                          .first

    last_daily_average&.value || nil
  end

  def create_or_update(stream_id:, date:, value:)
    stream_daily_average =
      StreamDailyAverage.find_or_initialize_by(stream_id: stream_id, date: date)

    stream_daily_average.update(value: value)
  end
end
