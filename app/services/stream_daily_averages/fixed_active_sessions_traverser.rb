module StreamDailyAverages
  class FixedActiveSessionsTraverser
    def initialize(
      fixed_sessions_repository: FixedSessionsRepository.new,
      timezone_finder: TimezoneFinder.create,
      stream_interactor: StreamInteractor.new
    )
      @fixed_sessions_repository = fixed_sessions_repository
      @timezone_finder = timezone_finder
      @stream_interactor = stream_interactor
    end

    def call
      fixed_sessions_repository.active_with_streams.each do |session|
        time_zone =
          timezone_finder.timezone_at(
            lng: session.longitude,
            lat: session.latitude,
          )
        session.streams.map do |stream|
          stream_interactor.call(stream_id: stream.id, time_zone: time_zone)
        end
      end
    end

    private

    attr_reader :fixed_sessions_repository, :timezone_finder, :stream_interactor
  end
end
