module FixedStreaming
  class StreamHourlyAveragesRecalculator
    def initialize(repository: StreamHourlyAverages::Repository.new)
      @repository = repository
    end

    def call(measurements:, stream_id:)
      return if measurements.empty?

      bucket_ends = measurements.map { |m| hour_bucket_end_for(m.time_with_time_zone) }

      repository.upsert_hourly_averages_for_stream(
        stream_id: stream_id,
        start_date_time: bucket_ends.min - 1.hour,
        end_date_time: bucket_ends.max,
      )
    end

    private

    attr_reader :repository

    # A bucket covers (end_date_time - 1h, end_date_time].
    # A measurement at exactly HH:00:00 closes the previous bucket (end = HH:00:00).
    def hour_bucket_end_for(time)
      time == time.beginning_of_hour ? time : time.beginning_of_hour + 1.hour
    end
  end
end
