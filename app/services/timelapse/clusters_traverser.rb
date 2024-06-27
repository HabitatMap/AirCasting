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

        averages =
          measurements_repository.cluster_averages(
            time_period: time_period,
            stream_ids: stream_ids,
            end_of_last_time_slice: end_of_last_time_slice
          )

        24.times do |time_slice_number|
          time_slice_averages = averages.select do |row|
            row['hour'] < end_of_last_time_slice - time_period.hours * time_slice_number &&
              row['hour'] >= end_of_last_time_slice - time_period.hours * (time_slice_number + 1)
          end

          if time_slice_averages.empty?
            cluster_averages << { cluster_id => { time: end_of_last_time_slice - time_period.hours * time_slice_number, value: nil } }
            next
          end

          average = time_slice_averages.sum { |row| row['avg_value'] } / time_slice_averages.size

          cluster_averages << { cluster_id => { time: end_of_last_time_slice - time_period.hours * time_slice_number, value: average } }
        end
      end

      cluster_averages
    end

    private

    attr_reader :end_of_last_time_slice, :measurements_repository
  end
end
