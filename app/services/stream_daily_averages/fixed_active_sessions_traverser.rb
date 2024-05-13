module StreamDailyAverages
  class FixedActiveSessionsTraverser
    def initialize(
      fixed_sessions_repository: FixedSessionsRepository.new,
      stream_interactor: StreamInteractor.new
    )
      @fixed_sessions_repository = fixed_sessions_repository
      @stream_interactor = stream_interactor
    end

    def call
      fixed_sessions_repository.active_with_streams.each do |session|
        session.streams.map do |stream|
          stream_interactor.call(
            stream_id: stream.id,
            time_zone: session.time_zone,
          )
        end
      end
    end

    private

    attr_reader :fixed_sessions_repository, :stream_interactor
  end
end
