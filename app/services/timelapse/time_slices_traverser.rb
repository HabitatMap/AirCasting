module Timelapse
  class TimeSlicesTraverser
    def initialize
      @end_of_last_time_slice = Time.current.beginning_of_hour + 1.hour
      @cluster_processor = ClusterProcessor.new
    end

    def call(time_shift:, clusters:)
      cluster_averages = []

      24.times do |time_slice_number|
        clusters.each do |cluster|
          cluster_averages <<
            cluster_processor.call(
              cluster,
              beginning_of_time_slice(time_shift, time_slice_number),
              end_of_time_slice(time_shift, time_slice_number)
            )
        end
      end

      cluster_averages
    end

    private

    attr_reader :end_of_last_time_slice, :cluster_processor

    def end_of_time_slice(time_shift, time_slice_number)
      end_of_last_time_slice - time_shift * time_slice_number
    end

    def beginning_of_time_slice(time_shift, time_slice_number)
      end_of_last_time_slice - time_shift * (time_slice_number + 1)
    end
  end
end
