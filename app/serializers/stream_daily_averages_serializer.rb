class StreamDailyAveragesSerializer
  def call(streams_daily_averages)
    streams_daily_averages.map do |stream_daily_average|
      {
        date: stream_daily_average.date.strftime('%Y-%m-%d'),
        value: stream_daily_average.value.round,
      }
    end
  end
end
