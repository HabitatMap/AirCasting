module FixedStreaming
  class Interactor
    def initialize(
      params_parser: ParamsParser.new,
      streams_repository: StreamsRepository.new,
      stream_creator: StreamCreator.new,
      measurements_creator: MeasurementsCreator.new,
      fixed_sessions_repository: FixedSessionsRepository.new
    )
      @params_parser = params_parser
      @streams_repository = streams_repository
      @stream_creator = stream_creator
      @measurements_creator = measurements_creator
      @fixed_sessions_repository = fixed_sessions_repository
    end

    def call(params:, user_id:)
      parsing_result = parse_params(params, user_id)

      return parsing_result unless parsing_result.success?
      session = parsing_result.value[:session]
      data = parsing_result.value[:data]

      ActiveRecord::Base.transaction do
        stream = find_stream(session, data) || create_stream(session, data)
        measurement_import_result, last_measurement =
          create_measurements(data, session, stream)
        update_session_end_timestamps(session, last_measurement)
        update_measurements_count(stream, measurement_import_result)
      end

      Success.new('measurements created')
    end

    private

    attr_reader :params_parser,
                :streams_repository,
                :stream_creator,
                :measurements_creator,
                :fixed_sessions_repository

    def parse_params(params, user_id)
      params_parser.call(params: params, user_id: user_id)
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

    def update_session_end_timestamps(session, last_measurement)
      if last_measurement.time > session.end_time_local
        fixed_sessions_repository.update_end_timestamps!(
          session: session,
          last_measurement: last_measurement,
        )
      end
    end

    def update_measurements_count(stream, measurement_import_result)
      streams_repository.update_measurements_count!(
        stream_id: stream.id,
        measurements_count: measurement_import_result.num_inserts,
      )
    end
  end
end
