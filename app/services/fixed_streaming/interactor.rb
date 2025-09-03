module FixedStreaming
  class Interactor
    def initialize(
      params_parser: ParamsParser.new,
      streams_repository: StreamsRepository.new,
      stream_creator: StreamCreator.new,
      measurements_creator: MeasurementsCreator.new,
      fixed_measurements_creator: FixedMeasurementsCreator.new,
      stream_daily_averages_recalculator: StreamDailyAveragesRecalculator.new,
      fixed_sessions_repository: FixedSessionsRepository.new
    )
      @params_parser = params_parser
      @streams_repository = streams_repository
      @stream_creator = stream_creator
      @measurements_creator = measurements_creator
      @fixed_measurements_creator = fixed_measurements_creator
      @stream_daily_averages_recalculator = stream_daily_averages_recalculator
      @fixed_sessions_repository = fixed_sessions_repository
    end

    def call(data:, compression:, user_id:)
      parsing_result = parse_params(data, compression, user_id)

      return parsing_result unless parsing_result.success?
      session, data, data_flow =
        parsing_result.value.values_at(:session, :data, :data_flow)

      ActiveRecord::Base.transaction do
        stream = find_stream(session, data) || create_stream(session, data)
        number_of_inserts, measurements =
          create_measurements(data, session, stream)
        fixed_measurement_import_result, fixed_measurements =
          create_fixed_measurements(data, session, stream)

        if data_flow == :sync
          stream_daily_averages_recalculator.call(
            measurements: measurements,
            time_zone: session.time_zone,
            stream_id: stream.id,
          )
        end

        update_session_end_timestamps(session, measurements)
        update_measurements_count(stream, number_of_inserts)
      end

      Success.new('measurements created')
    end

    private

    attr_reader :params_parser,
                :streams_repository,
                :stream_creator,
                :measurements_creator,
                :fixed_measurements_creator,
                :stream_daily_averages_recalculator,
                :fixed_sessions_repository

    def parse_params(data, compression, user_id)
      params_parser.call(data: data, compression: compression, user_id: user_id)
    end

    def find_stream(session, data)
      streams_repository.find_by_session_uuid_and_sensor_name(
        session_uuid: session.uuid,
        sensor_name: data[:sensor_name],
      )
    end

    def create_stream(session, data)
      stream_creator.call(session: session, data: data)
    end

    def create_measurements(data, session, stream)
      measurements_creator.call(
        data: data[:measurements],
        session: session,
        stream: stream,
      )
    end

    def create_fixed_measurements(data, session, stream)
      fixed_measurements_creator.call(
        data: data[:measurements],
        time_zone: session.time_zone,
        stream: stream,
      )
    end

    def update_session_end_timestamps(session, measurements)
      last_measurement = measurements.max_by(&:time)

      if last_measurement.time > session.end_time_local
        fixed_sessions_repository.update_end_timestamps!(
          session: session,
          last_measurement: last_measurement,
        )
      end
    end

    def update_measurements_count(stream, number_of_inserts)
      streams_repository.update_measurements_count!(
        stream_id: stream.id,
        measurements_count: number_of_inserts,
      )
    end
  end
end
