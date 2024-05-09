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
end
