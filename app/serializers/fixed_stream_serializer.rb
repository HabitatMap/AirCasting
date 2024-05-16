class FixedStreamSerializer
  def initialize
    @stream_daily_averages_serializer = StreamDailyAveragesSerializer.new
    @measurements_serializer = MeasurementsSerializer.new
    @stream_serializer = StreamSerializer.new
  end

  def call(stream:, measurements:, stream_daily_averages:, thresholds:)
    {
      stream: stream_serializer.call(stream),
      measurements: measurements_serializer.call(measurements),
      stream_daily_averages:
        stream_daily_averages_serializer.call(stream_daily_averages),
      thresholds: serialize_thresholds(thresholds),
    }
  end

  private

  attr_reader :stream_daily_averages_serializer, :measurements_serializer, :stream_serializer

  def serialize_thresholds(thresholds)
    {
      min: thresholds.threshold_very_low,
      low: thresholds.threshold_low,
      middle: thresholds.threshold_medium,
      high: thresholds.threshold_high,
      max: thresholds.threshold_very_high,
    }
  end
end
