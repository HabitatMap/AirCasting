module Sessions
  class SyncMeasurementsInteractor
    def initialize(
      sessions_repository: SessionsRepository.new,
      session_serializer: SessionSerializer.new
    )
      @sessions_repository = sessions_repository
      @session_serializer = session_serializer
    end

    def call(uuid:, last_measurement_sync:)
      session = sessions_repository.find_with_streams(uuid: uuid) or raise NotFound
      serialized_session = session_serializer.call(session)

      Success.new(serialized_session)
    end

    private

    attr_reader :sessions_repository, :session_serializer
  end
end
