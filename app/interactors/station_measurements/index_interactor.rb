module StationMeasurements
  class IndexInteractor
    def initialize(
      contract: Api::StationMeasurementsContract.new,
      repository: ::StationMeasurementsRepository.new,
      serializer: StationMeasurementsSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      validation_result = validate(params)

      return validation_result if validation_result.is_a?(Failure)

      station_stream_id, start_time, end_time = fetch_params(validation_result)

      measurements =
        repository.filter(
          station_stream_id: station_stream_id,
          start_time: start_time,
          end_time: end_time,
        )
      serialized_measurements = serializer.call(measurements)

      Success.new(serialized_measurements)
    end

    private

    attr_reader :contract, :repository, :serializer

    def validate(params)
      result = contract.call(params)
      return Failure.new(result.errors.to_h) if result.failure?

      result.to_h
    end

    def fetch_params(validation_result)
      station_stream_id = validation_result[:station_stream_id]
      start_time = Time.at(validation_result[:start_time] / 1000.0)
      end_time = Time.at(validation_result[:end_time] / 1000.0)

      [station_stream_id, start_time, end_time]
    end
  end
end
