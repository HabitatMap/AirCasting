module Timelapse
  class ClustersTraverser
    def initialize
      @end_of_last_time_slice = Time.current.beginning_of_hour + 1.hour
      @measurements_repository = MeasurementsRepository.new
    end

    def call(time_period:, clusters:)
      cluster_averages = []

      clusters.each do |cluster|
        cluster_id = cluster.keys.first
        stream_ids = cluster.values.first

        measurements_repository.cluster_averages(
          time_period: time_period,
          stream_ids: stream_ids,
          end_of_last_time_slice: end_of_last_time_slice
        ).each do |row|
            end_of_current_time_slice = row['slice'] + time_period.hours
            cluster_averages << { cluster_id => { time: end_of_current_time_slice, value: row['avg_value'] } }
          end
      end

      cluster_averages
    end

    private

    attr_reader :end_of_last_time_slice, :measurements_repository
  end
end
