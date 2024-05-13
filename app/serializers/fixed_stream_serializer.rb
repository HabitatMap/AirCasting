class FixedStreamSerializer
  def initialize
    @stream_daily_averages_serializer = StreamDailyAveragesSerializer.new
    @measurements_serializer = MeasurementsSerializer.new
    @stream_serializer = StreamSerializer.new
    @thresholds_serializer = ThresholdsSerializer.new
  end

  def call(stream:, measurements:, stream_daily_averages:, thresholds:)
    {
      stream: stream_serializer.call(stream),
      measurements: measurements_serializer.call(measurements),
      stream_daily_averages:
        stream_daily_averages_serializer.call(stream_daily_averages),
      thresholds: thresholds_serializer.call(thresholds),
    }
  end

  private

  attr_reader :stream_daily_averages_serializer, :measurements_serializer, :stream_serializer, :thresholds_serializer
end
