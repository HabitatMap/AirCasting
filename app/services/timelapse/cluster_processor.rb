module Timelapse
  class ClusterProcessor
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call (cluster:, beginning_of_time_slice:, end_of_time_slice:)
      cluster_id, stream_ids = cluster

      # logging for debugging
      Rails.logger.info "__________________cluster_processor_______________________"
      Rails.logger.info "____________________ cluster_id ____________________"
      Rails.logger.info "cluster_id: #{cluster_id}"
      Rails.logger.info "____________________ stream_ids ____________________"
      Rails.logger.info "stream_ids: #{stream_ids}"
      Rails.logger.info "____________________ cluster ____________________"
      Rails.logger.info "cluster: #{cluster}"
      Rails.logger.info "_____________________________________________________"

      return { cluster_id => { time: end_of_time_slice, value: nil } } if stream_ids.nil? || stream_ids.empty?

      averages =
        measurements_repository.streams_averages_from_period(
          stream_ids: stream_ids,
          start_date: beginning_of_time_slice,
          end_date: end_of_time_slice
        )

      { cluster_id => averages }
    end

    private

    attr_reader :measurements_repository
  end
end
