module StreamDailyAverages
  class AverageValueUpdater
    def initialize(
      measurements_repository: MeasurementsRepository.new,
      stream_daily_averages_reposiotry: StreamDailyAveragesRepository.new
    )
      @measurements_repository = measurements_repository
      @stream_daily_averages_reposiotry = stream_daily_averages_reposiotry
    end

    def call(stream_id:, time_zone:)
      average_value =
        measurements_repository.stream_daily_average_value(
          stream_id: stream_id,
          beginning_of_day: beginning_of_day(time_zone),
        )

      stream_daily_averages_reposiotry.create_or_update(
        stream_id: stream_id,
        date: beginning_of_day(time_zone).to_date,
        value: average_value,
      )
    end

    private

    attr_reader :measurements_repository, :stream_daily_averages_reposiotry

    def beginning_of_day(time_zone)
      Time.current.in_time_zone(time_zone).beginning_of_day
    end
  end
end
