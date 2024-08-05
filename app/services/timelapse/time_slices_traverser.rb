module Timelapse
  class TimeSlicesTraverser
    def initialize
      @end_of_last_time_slice = Time.current.beginning_of_hour + 1.hour
      @cluster_processor = ClusterProcessor.new
    end

    def call(time_period:, clusters:)
      cluster_averages = []
      data_points = 24 * time_period.to_i

      data_points.times do |time_slice_number|
        clusters.each do |cluster|
          cluster_averages <<
            cluster_processor.call(
              cluster: cluster,
              beginning_of_time_slice: end_of_last_time_slice - (time_slice_number + 1).hours,
              end_of_time_slice: end_of_last_time_slice - time_slice_number.hours
            )
        end
      end

      cluster_averages
    end

    private

    attr_reader :end_of_last_time_slice, :cluster_processor
  end
end
