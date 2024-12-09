module StreamHourlyAverages
  class Updater
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call
      start_date_time, end_date_time = date_time_range

      insert_result =
        repository.insert_stream_hourly_averages(
          start_date_time: start_date_time,
          end_date_time: end_date_time,
        )
      repository.update_last_hourly_average(insert_result) if insert_result.any?
    end

    private

    attr_reader :repository

    def date_time_range
      end_date_time = Time.current.beginning_of_hour
      start_date_time = end_date_time - 1.hour

      [start_date_time, end_date_time]
    end
  end
end
