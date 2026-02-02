module HourlyAverages
  class ScheduledUpdater
    LOOKBACK = 6.hours

    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call
      last_measured_at = Time.current.beginning_of_hour + 1.hour
      measured_at = last_measured_at - LOOKBACK

      while measured_at <= last_measured_at
        repository.calculate_for_hour(measured_at:)
        measured_at += 1.hour
      end
    end

    private

    attr_reader :repository
  end
end
