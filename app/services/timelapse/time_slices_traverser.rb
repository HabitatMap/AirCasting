module Timelapse
  class TimeSlicesTraverser
    def initialize
      @end_of_last_time_slice = Time.current.beginning_of_hour + 1.hour
      @measurements_repository = MeasurementsRepository.new
    end

    def call(time_shift:, clusters:)
      averages = []
      24.times do |time_slice_number|
        clusters.each do |cluster|
          averages <<
            process_cluster(
              cluster,
              beginning_of_time_slice(time_shift, time_slice_number),
              end_of_time_slice(time_shift, time_slice_number)
            )
        end
      end

      averages
    end

    private

    attr_reader :end_of_last_time_slice, :measurements_repository

    def end_of_time_slice(time_shift, time_slice_number)
      end_of_last_time_slice - time_shift * time_slice_number
    end

    def beginning_of_time_slice(time_shift, time_slice_number)
      end_of_last_time_slice - time_shift * (time_slice_number + 1)
    end

    def process_cluster(cluster, beginning_of_time_slice, end_of_time_slice)
      cluster_id = cluster.keys.first
      stream_ids = cluster[cluster_id]

      return { cluster_id => { time: end_of_time_slice, value: nil } } if stream_ids.empty?

      stream_averages_sum = calculate_stream_averages_sum(stream_ids, beginning_of_time_slice, end_of_time_slice)
      average = stream_averages_sum / stream_ids.size

      { cluster_id => { time: end_of_time_slice, value: average } }
    end

    def calculate_stream_averages_sum(stream_ids, start_date, end_date)
      stream_ids.sum do |stream_id|
        measurements_repository.stream_average_from_period(
          stream_id: stream_id,
          start_date: start_date,
          end_date: end_date
        ) || 0
      end
    end
  end
end
