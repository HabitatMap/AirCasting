class StationStreamShowSerializer
  def initialize
    @stream_daily_averages_serializer = StationStreamDailyAveragesShowSerializer.new
    @measurements_serializer = StationMeasurementsSerializer.new
    @station_stream_serializer = StationStreamSerializer.new
  end

  def call(station_stream:, measurements:, stream_daily_averages:)
    {
      stream: station_stream_serializer.call(station_stream),
      measurements:
        measurements_serializer.call(measurements, time_zone: station_stream.time_zone),
      stream_daily_averages:
        stream_daily_averages_serializer.call(stream_daily_averages),
    }
  end

  private

  attr_reader :station_stream_serializer, :measurements_serializer, :stream_daily_averages_serializer
end
