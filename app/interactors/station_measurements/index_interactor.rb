module StationMeasurements
  class IndexInteractor
    def initialize(
      contract: Api::StationMeasurementsContract.new,
      repository: ::StationMeasurementsRepository.new,
      serializer: StationMeasurementsSerializer.new
    )
      @contract = contract
      @repository = repository
      @serializer = serializer
    end

    def call(params:)
      validation_result = validate(params)

      return validation_result if validation_result.is_a?(Failure)

      station_stream_id, time_zone, start_time, end_time = fetch_params(validation_result)

      measurements =
        repository.filter(
          station_stream_id: station_stream_id,
          start_time: start_time,
          end_time: end_time,
        )
      serialized_measurements = serializer.call(measurements, time_zone: time_zone)

      Success.new(serialized_measurements)
    end

    private

    attr_reader :contract, :repository, :serializer

    def validate(params)
      result = contract.call(params)
      return Failure.new(result.errors.to_h) if result.failure?

      result.to_h
    end

    def fetch_params(validation_result)
      station_stream_id = validation_result[:station_stream_id]
      time_zone = StationStream.find_by(id: station_stream_id)&.time_zone || 'UTC'

      # The frontend sends "local-as-UTC" epoch ms: local wall-clock time components
      # packed as a UTC epoch (matching the AirBeam convention). We must re-interpret
      # those components as the station's local time to get the real UTC for filtering
      # the measured_at (timestamptz) column.
      start_time =
        Utils.from_local_as_utc(Time.at(validation_result[:start_time] / 1000.0).utc, time_zone)
      end_time =
        Utils.from_local_as_utc(Time.at(validation_result[:end_time] / 1000.0).utc, time_zone)

      [station_stream_id, time_zone, start_time, end_time]
    end
  end
end
