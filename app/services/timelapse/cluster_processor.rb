module Timelapse
  class ClusterProcessor
    def initialize
      @stream_hourly_averages_repository = StreamHourlyAverages::Repository.new
    end

    def call(clusters:)
      result = {}

      clusters.each do |cluster|
        averages =
          stream_hourly_averages_repository.streams_averages_last_7_days(
            stream_ids: cluster[:stream_ids],
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

    attr_reader :stream_hourly_averages_repository
  end
end
