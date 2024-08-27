module Timelapse
  class ClusterProcessor
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call (clusters:)
      result = {}

      clusters.each do |cluster|
        averages =
          measurements_repository.streams_averages_from_period(
            stream_ids: cluster[:stream_ids],
          )

        averages.each do |average|
          result[average[:time]] ||= []
          result[average[:time]] <<
            {
              "value" => average[:value],
              "latitude" => cluster[:latitude],
              "longitude" => cluster[:longitude],
              "sessions" => cluster[:session_count]
            }
        end
      end

      result
    end

    private

    attr_reader :measurements_repository
  end
end
