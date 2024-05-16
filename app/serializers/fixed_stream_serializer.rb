class FixedStreamSerializer
  def initialize
    @stream_daily_averages_serializer = StreamDailyAveragesSerializer.new
    @measurements_serializer = MeasurementsSerializer.new
    @stream_serializer = StreamSerializer.new
  end

  def call(stream:, measurements:, stream_daily_averages:)
    {
      stream: stream_serializer.call(stream, default_thresholds),
      measurements: measurements_serializer.call(measurements),
      stream_daily_averages:
        stream_daily_averages_serializer.call(stream_daily_averages),
    }
  end

  private

  attr_reader :stream_daily_averages_serializer, :measurements_serializer, :stream_serializer
end
