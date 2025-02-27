module FixedSessions
  class IndexInteractor
    def initialize(
      contract:,
      sessions_repository: SessionsRepository.new,
      fixed_sessions_serializer: FixedSessionsSerializer.new
    )
      @contract = contract
      @sessions_repository = sessions_repository
      @fixed_sessions_serializer = fixed_sessions_serializer
    end

    def call
      return Failure.new(contract.errors) if contract.failure?

      time_current = Time.current
      sessions =
        sessions_repository.fixed_active_government_sessions(
          sensor_name: data[:sensor_name],
          east: data[:east],
          west: data[:west],
          north: data[:north],
          south: data[:south],
        )

      Rails.logger.info(
        "sessions fetching took: #{Time.current - time_current}",
      )
      time_current = Time.current
      serialized_sessions = fixed_sessions_serializer.call(sessions)
      Rails.logger.info(
        "sessions serialization took: #{Time.current - time_current}",
      )
      Success.new(serialized_sessions)
    end

    private

    attr_reader :contract, :sessions_repository, :fixed_sessions_serializer

    def data
      contract.to_h
    end
  end
end
