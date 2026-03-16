module StationStreamDailyAverages
  class IndexInteractor
    def initialize(
      repository: StationStreamDailyAveragesRepository.new,
      serializer: StationStreamDailyAveragesShowSerializer.new
    )
      @repository = repository
      @serializer = serializer
    end

    def call(stream_id:, start_date:, end_date:)
      averages = repository.from_time_range(
        station_stream_id: stream_id,
        start_date: start_date,
        end_date: end_date,
      )
      serialized_averages = serializer.call(averages)

      Success.new(serialized_averages)
    end

    private

    attr_reader :repository, :serializer
  end
end
