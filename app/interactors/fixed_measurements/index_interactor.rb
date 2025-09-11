module FixedMeasurements
  class IndexInteractor
    def initialize(
      contract: Api::FixedMeasurementsContract.new,
      repository: ::FixedMeasurementsRepository.new,
      serializer: MeasurementsSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      validation_result = validate(params)

      return validation_result if validation_result.is_a?(Failure)

      stream_id, start_time, end_time = fetch_params(validation_result)

      fixed_measurements =
        repository.filter(
          stream_id: stream_id,
          start_time: start_time,
          end_time: end_time,
        )
      serialized_measurements = serializer.call(fixed_measurements)

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
      stream_id = validation_result[:stream_id]
      start_time = Time.at(validation_result[:start_time] / 1000.0)
      end_time = Time.at(validation_result[:end_time] / 1000.0)

      [stream_id, start_time, end_time]
    end
  end
end
