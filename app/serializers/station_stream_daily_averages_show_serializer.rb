class StationStreamDailyAveragesShowSerializer
  def call(stream_daily_averages)
    stream_daily_averages.map do |average|
      {
        date: average.date.strftime('%Y-%m-%d'),
        value: average.value.round,
      }
    end
  end
end
