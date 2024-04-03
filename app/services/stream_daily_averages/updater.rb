module StreamDailyAverages
  class Updater
    def initialize(
      measurements_repository: MeasurementsRepository.new,
      stream_daily_averages_repository: StreamDailyAveragesRepository.new
    )
      @measurements_repository = measurements_repository
      @stream_daily_averages_repository = stream_daily_averages_repository
    end

    def call(stream_id:, beginning_of_day:)
      value = average_value(stream_id, beginning_of_day)

      create_or_update_stream_daily_average(stream_id, beginning_of_day, value)
    end

    private

    attr_reader :measurements_repository, :stream_daily_averages_repository

    def average_value(stream_id, beginning_of_day)
      measurements_repository.stream_daily_average_value(
        stream_id: stream_id,
        beginning_of_day: beginning_of_day,
      )
    end

    def create_or_update_stream_daily_average(
      stream_id,
      beginning_of_day,
      value
    )
      stream_daily_averages_repository.create_or_update(
        stream_id: stream_id,
        date: beginning_of_day.to_date,
        value: value,
      )
    end
  end
end
