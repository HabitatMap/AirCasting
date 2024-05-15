class FixedStreamSerializer
  def initialize
    @stream_daily_averages_serializer = StreamDailyAveragesSerializer.new
    @measurements_serializer = MeasurementsSerializer.new
    @stream_serializer = StreamSerializer.new
    @threshold_serializer = ThresholdSerializer.new
  end

  def call(stream:, measurements:, stream_daily_averages:, default_thresholds:)
    thresholds = default_or_custom_thresholds(default_thresholds, stream)

    {
      stream: stream_serializer.call(stream),
      measurements: measurements_serializer.call(measurements),
      stream_daily_averages:
        stream_daily_averages_serializer.call(stream_daily_averages),
      thresholds: threshold_serializer.call(thresholds),
    }
  end

  private

  attr_reader :stream_daily_averages_serializer, :measurements_serializer, :stream_serializer, :threshold_serializer

  def default_or_custom_thresholds(default_thresholds, stream)
    source = default_thresholds || stream

    {
      threshold_very_low: source.threshold_very_low,
      threshold_low: source.threshold_low,
      threshold_medium: source.threshold_medium,
      threshold_high: source.threshold_high,
      threshold_very_high: source.threshold_very_high,
    }
  end
end
