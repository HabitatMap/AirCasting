module FixedStreamDailyAverages
  class IndexInteractor
    def initialize(
      contract: Api::StreamDailyAveragesContract.new,
      repository: StreamDailyAveragesRepository.new,
      serializer: StreamDailyAveragesSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      result = contract.call(params)
      # The message set, not `to_h`: `to_h` throws away the failing predicate,
      # and `ValidationErrorsSerializer` needs it to give each field a code.
      return Failure.new(result.errors) if result.failure?

      query = result.to_h
      averages = repository.from_time_range(
        stream_id: query[:stream_id],
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
