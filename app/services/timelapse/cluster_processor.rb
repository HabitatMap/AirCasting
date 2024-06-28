module Timelapse
  class ClusterProcessor
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call (cluster, beginning_of_time_slice, end_of_time_slice)
      cluster_id = cluster.keys.first
      stream_ids = cluster[cluster_id]

      return { cluster_id => { time: end_of_time_slice, value: nil } } if stream_ids.empty?

      average =
        measurements_repository.streams_averages_from_period(
          stream_ids: stream_ids,
          start_date: beginning_of_time_slice,
          end_date: end_of_time_slice
        )

      { cluster_id => { time: end_of_time_slice, value: average } }
    end

    private

    attr_reader :measurements_repository
  end
end
