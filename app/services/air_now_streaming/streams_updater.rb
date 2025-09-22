module AirNowStreaming
  class StreamsUpdater
    def initialize(
      repository: Repository.new,
      fixed_measurements_repository: FixedMeasurementsRepository.new
    )
      @repository = repository
      @fixed_measurements_repository = fixed_measurements_repository
    end

    def call(measurements_to_create:)
      fixed_measurements = []
      sessions_to_update = []
      streams_to_update = []

      measurements_to_create.each do |stream, measurements|
        last_measurement = measurements.max_by { |m| m[:time] }
        if update_session_and_stream?(stream.session, last_measurement)
          sessions_to_update <<
            session_with_updates_attrs(stream.session, last_measurement)
          streams_to_update <<
            stream_with_updated_attrs(stream, last_measurement)
        end

        measurements.each do |measurement_data|
          fixed_measurements <<
            build_fixed_measurement(stream, measurement_data)
        end
      end

      update_sessions(sessions_to_update.compact)
      update_streams(streams_to_update.compact)
      import_fixed_measurements(fixed_measurements)
    end

    private

    attr_reader :repository, :fixed_measurements_repository

    def build_fixed_measurement(stream, measurement_data)
      FixedMeasurement.new(
        value: measurement_data[:value],
        time: measurement_data[:time],
        time_with_time_zone: measurement_data[:time_with_time_zone],
        stream: stream,
      )
    end

    def update_session_and_stream?(session, last_measurement)
      last_measurement[:time] > session.end_time_local
    end

    def session_with_updates_attrs(session, last_measurement)
      session.end_time_local = last_measurement[:time]
      session.last_measurement_at = last_measurement[:time_with_time_zone]

      session
    end

    def stream_with_updated_attrs(stream, last_measurement)
      stream.average_value = last_measurement[:value]

      stream
    end

    def update_sessions(sessions_update)
      repository.update_sessions_end_timestamps(sessions: sessions_update)
    end

    def update_streams(streams_to_update)
      repository.update_streams_average_value(streams: streams_to_update)
    end

    def import_fixed_measurements(fixed_measurements)
      fixed_measurements_repository.import(
        measurements: fixed_measurements,
        on_duplicate_key_ignore: true,
      )
    end
  end
end
