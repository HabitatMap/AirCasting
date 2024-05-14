module StreamDailyAverages
  class Updater
    def initialize(
      measurements_repository: MeasurementsRepository.new,
      stream_daily_averages_repository: StreamDailyAveragesRepository.new
    )
      @measurements_repository = measurements_repository
      @stream_daily_averages_repository = stream_daily_averages_repository
    end

    def call(stream_id:, time_with_time_zone:)
      value = average_value(stream_id, time_with_time_zone)

      create_or_update_stream_daily_average(
        stream_id,
        time_with_time_zone,
        value,
      )
    end

    private

    attr_reader :measurements_repository, :stream_daily_averages_repository

    def average_value(stream_id, time_with_time_zone)
      measurements_repository.stream_daily_average_value(
        stream_id: stream_id,
        time_with_time_zone: time_with_time_zone,
      )
    end

    def create_or_update_stream_daily_average(
      stream_id,
      time_with_time_zone,
      value
    )
      stream_daily_averages_repository.create_or_update(
        stream_id: stream_id,
        date: time_with_time_zone.to_date,
        value: value,
      )
    end
  end
end
