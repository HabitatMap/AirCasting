module Timelapse
  class ClusterProcessor
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call(clusters:, sensor_name:)
      result = {}

      clusters.each do |cluster|
        averages =
          measurements_repository.streams_averages_hourly_last_7_days(
            stream_ids: cluster[:stream_ids],
            with_hour_shift: airbeam_data?(sensor_name),
          )

        averages.each do |average|
          result[average[:time]] ||= []
          result[average[:time]] << {
            'value' => average[:value],
            'latitude' => cluster[:latitude],
            'longitude' => cluster[:longitude],
            'sessions' => cluster[:session_count],
          }
        end
      end

      result
    end

    private

    attr_reader :measurements_repository

    def airbeam_data?(sensor_name)
      %w[government-pm2.5 government-no2 government-ozone].exclude?(sensor_name)
    end
  end
end
