module GovernmentSources
  class StationStreamTimestampsUpdater
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(measurements:)
      return if measurements.empty?

      bounds_by_stream = compute_bounds(measurements)

      repository.bulk_update_stream_timestamps(
        bounds_by_stream: bounds_by_stream,
      )
    end

    private

    attr_reader :repository

    def compute_bounds(measurements)
      measurements
        .group_by { |m| m[:station_stream_id] }
        .transform_values do |ms|
          timestamps = ms.map { |m| m[:measured_at] }
          { min: timestamps.min, max: timestamps.max }
        end
    end
  end
end
