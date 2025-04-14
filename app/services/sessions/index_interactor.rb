module Sessions
  class IndexInteractor
    def initialize(
      sessions_repository: SessionsRepository.new,
      sessions_serializer: SessionsSerializer.new
    )
      @sessions_repository = sessions_repository
      @session_serializer = sessions_serializer
    end

    def call(sensor_package_name:, start_datetime:, end_datetime:)
      sessions =
        sessions_repository.filter_by_sensor_package_name_and_datetime(
          sensor_package_name: sensor_package_name,
          start_datetime: start_datetime,
          end_datetime: end_datetime,
        )
      result = session_serializer.call(sessions: sessions)

      Success.new(result)
    end

    private

    attr_reader :sessions_repository, :session_serializer
  end
end
