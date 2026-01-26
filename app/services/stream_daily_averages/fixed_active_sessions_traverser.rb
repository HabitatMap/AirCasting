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
      current_time = Time.current

      fixed_sessions_repository.active_with_streams.find_each do |session|
        station_current_time = current_time.in_time_zone(session.time_zone)
        session.streams.each do |stream|
          begin
            stream_interactor.call(
              stream_id: stream.id,
              station_current_time: station_current_time,
              is_gov_stream: is_gov_stream(session),
            )
          rescue => e
            Rails.logger.warn(
              "Average calculation error for stream #{stream.id}: #{e.message}",
            )
          end
        end
      end
    end

    private

    attr_reader :fixed_sessions_repository, :stream_interactor

    def is_gov_stream(session)
      session.username == 'US EPA AirNow' || session.username == 'EEA'
    end
  end
end
