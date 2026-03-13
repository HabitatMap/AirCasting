class StationStreamDailyAveragesRepository
  def from_full_last_3_calendar_months(station_stream_id:)
    start_date = Date.current.prev_month(3).beginning_of_month

    StationStreamDailyAverage
      .where(station_stream_id: station_stream_id)
      .where('date >= ?', start_date)
      .order(:date)
  end
end
