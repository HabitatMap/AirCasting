class StationStreamDailyAveragesRepository
  def from_full_last_3_calendar_months(station_stream_id:)
    start_date = Date.current.prev_month(3).beginning_of_month

    StationStreamDailyAverage
      .where(station_stream_id: station_stream_id)
      .where('date >= ?', start_date)
      .order(:date)
  end

  def from_time_range(station_stream_id:, start_date:, end_date:)
    StationStreamDailyAverage
      .where(station_stream_id: station_stream_id)
      .where('date >= ? AND date <= ?', start_date, end_date)
      .order(:date)
  end
end
