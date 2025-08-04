module FixedPolling
  class Interactor
    def initialize(
      contract: Contract.new,
      repository: Repository.new,
      serializer: Serializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      validation_result = validate(params)

      return validation_result if validation_result.is_a?(Failure)

      session = fetch_session(validation_result[:uuid])
      unless session
        return Failure.new('session not found for UUID: session_uuid')
      end

      measurements =
        fetch_measurements(session, validation_result[:last_measurement_sync])

      Success.new(serialize_session_with_measurements(session, measurements))
    end

    private

    attr_reader :contract, :repository, :serializer

    def validate(params)
      result = contract.call(params)
      return Failure.new(result.errors.to_h) if result.failure?

      result.to_h
    end

    def fetch_session(session_uuid)
      repository.session(uuid: session_uuid)
    end

    def fetch_measurements(session, last_measurement_sync)
      return [] if last_measurement_sync >= session.end_time_local

      since = [last_measurement_sync, session.end_time_local - 24.hours].max

      repository.measurements_grouped_by_stream_ids(
        stream_ids: session.stream_ids,
        since: since,
      )
    end

    def serialize_session_with_measurements(session, measurements)
      serializer.call(
        session: session,
        tag_list: repository.tag_list(session: session),
        measurements: measurements,
      )
    end
  end
end
