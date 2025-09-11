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
      session_rows_to_update = []
      measurements_to_create.each do |stream, measurements|
        session_rows_to_update <<
          check_session_end_timestamps(stream.session, measurements)
        measurements.each do |measurement_data|
          fixed_measurements <<
            build_fixed_measurement(stream, measurement_data)
        end
      end

      update_sessions(session_rows_to_update.compact)

      fixed_measurements_repository.import(
        measurements: fixed_measurements,
        on_duplicate_key_ignore: true,
      )
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

    def check_session_end_timestamps(session, measurements)
      last_measurement = measurements.max_by { |m| m[:time] }

      return unless last_measurement[:time] > session.end_time_local

      {
        id: session.id,
        end_time_local: last_measurement[:time],
        last_measurement_at: last_measurement[:time_with_time_zone],
        updated_at: Time.current,
        type: 'FixedSession',
      }
    end

    def update_sessions(session_rows_to_update)
      repository.update_sessions_end_timestamps(
        session_rows: session_rows_to_update,
      )
    end
  end
end
