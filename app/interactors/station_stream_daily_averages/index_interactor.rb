module StationStreamDailyAverages
  class IndexInteractor
    def initialize(
      contract: Api::StreamDailyAveragesContract.new,
      repository: StationStreamDailyAveragesRepository.new,
      serializer: StationStreamDailyAveragesShowSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      result = contract.call(params)
      return Failure.new(result.errors) if result.failure?

      query = result.to_h
      # `stream_id` on the wire, `station_stream_id` in the repository — the
      # parameter keeps the fixed-stream name so the frontend can use one call
      # site for both.
      averages = repository.from_time_range(
        station_stream_id: query[:stream_id],
        start_date: query[:start_date],
        end_date: query[:end_date],
      )
      serialized_averages = serializer.call(averages)

      Success.new(serialized_averages)
    end

    private

    attr_reader :contract, :repository, :serializer
  end
end
