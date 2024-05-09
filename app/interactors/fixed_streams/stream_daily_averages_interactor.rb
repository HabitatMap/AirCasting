module FixedStreams
  class StreamDailyAveragesInteractor
    def initialize(
      stream_daily_averages_repository: StreamDailyAveragesRepository.new,
      stream_daily_averages_serializer: StreamDailyAveragesSerializer.new
    )
      @stream_daily_averages_repository = stream_daily_averages_repository
      @stream_daily_averages_serializer = stream_daily_averages_serializer
    end

    def call(stream_id:, start_date:, end_date:)
      averages = stream_daily_averages_repository.from_time_range(stream_id: stream_id, start_date: start_date, end_date: end_date)
      serialized_averages = stream_daily_averages_serializer.call(averages)
      serialized_averages ? nil : serialized_averages = []

      Success.new(serialized_averages)
    end

    private

    attr_reader :stream_daily_averages_repository, :stream_daily_averages_serializer
  end
end
