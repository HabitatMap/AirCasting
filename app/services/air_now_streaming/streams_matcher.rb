module AirNowStreaming
  class StreamsMatcher
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(parsed_measurements:)
      streams = repository.air_now_streams
      matched_measurements, unmatched_measurements =
        match_parsed_measurements_with_streams(streams, parsed_measurements)

      [matched_measurements, unmatched_measurements]
    end

    private

    attr_reader :repository

    def match_parsed_measurements_with_streams(streams, parsed_measurements)
      matched_measurements = {}

      streams.each do |stream|
        key = build_key(stream)

        if parsed_measurements[key]
          matched_measurements[stream] = parsed_measurements[key]

          parsed_measurements.delete(key)
        end
      end

      [matched_measurements, parsed_measurements]
    end

    def build_key(stream)
      {
        latitude: stream.session.latitude.to_f,
        longitude: stream.session.longitude.to_f,
        sensor_name: stream.threshold_set.sensor_name,
      }
    end
  end
end
