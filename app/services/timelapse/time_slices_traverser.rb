module Timelapse
  class TimeSlicesTraverser
    def initialize
      @end_of_last_time_slice = Time.current.beginning_of_hour + 1.hour
      @cluster_processor = ClusterProcessor.new
    end

    def call(time_period:, clusters:)
      cluster_averages = []
      hours_to_calculate = 24 * time_period.to_i
      begining_of_first_time_slice = end_of_last_time_slice - hours_to_calculate.hours

      clusters.each do |cluster|
        cluster_averages <<
          cluster_processor.call(
            cluster: cluster,
            beginning_of_time_slice: begining_of_first_time_slice,
            end_of_time_slice: end_of_last_time_slice
          )
      end

      cluster_averages.flatten
    end

    private

    attr_reader :end_of_last_time_slice, :cluster_processor
  end
end
