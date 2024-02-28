module StreamDailyAverages
  class Interactor
    def initialize(
      fixed_sessions_repository: FixedSessionsRepository.new,
      timezone_finder: TimezoneFinder.create,
      average_value_updater: AverageValueUpdater.new
    )
      @fixed_sessions_repository = fixed_sessions_repository
      @timezone_finder = timezone_finder
      @average_value_updater = average_value_updater
    end

    def call
      fixed_sessions_repository.active_with_streams.each do |session|
        time_zone =
          timezone_finder.timezone_at(
            lng: session.longitude,
            lat: session.latitude,
          )
        session.streams.map do |stream|
          average_value_updater.call(stream_id: stream.id, time_zone: time_zone)
        end
      end
    end

    private

    attr_reader :fixed_sessions_repository,
                :timezone_finder,
                :average_value_updater
  end
end
