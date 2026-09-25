module FixedStreaming
  class Interactor
    # Reads a zoneless timestamp without letting the OS zone touch its digits.
    UTC = ActiveSupport::TimeZone['UTC'].freeze

    def initialize(
      params_parser: ParamsParser.new,
      streams_repository: StreamsRepository.new,
      stream_creator: StreamCreator.new,
      fixed_measurements_creator: FixedMeasurementsCreator.new,
      stream_daily_averages_recalculator: StreamDailyAveragesRecalculator.new,
      stream_hourly_averages_recalculator: StreamHourlyAveragesRecalculator.new,
      fixed_sessions_repository: FixedSessionsRepository.new,
      cutoff: MeasurementCutoff.new
    )
      @params_parser = params_parser
      @streams_repository = streams_repository
      @stream_creator = stream_creator
      @fixed_measurements_creator = fixed_measurements_creator
      @stream_daily_averages_recalculator = stream_daily_averages_recalculator
      @stream_hourly_averages_recalculator = stream_hourly_averages_recalculator
      @fixed_sessions_repository = fixed_sessions_repository
      @cutoff = cutoff
    end

    def call(data:, compression:, user_id:)
      parsing_result = parse_params(data, compression, user_id)

      return parsing_result unless parsing_result.success?
      session, data, data_flow =
        parsing_result.value.values_at(:session, :data, :data_flow)

      measurements = reject_after_finish(session, data[:measurements])
      # A batch that was entirely recorded after the finish is a success with
      # nothing to write: the AirBeam clears it on a 2xx and stops resending.
      return Success.new('measurements created') if measurements.empty?

      data = data.merge(measurements: measurements)

      ActiveRecord::Base.transaction do
        stream = find_stream(session, data) || create_stream(session, data)
        fixed_measurements = create_fixed_measurements(data, session, stream)

        if data_flow == :sync
          stream_daily_averages_recalculator.call(
            measurements: fixed_measurements,
            time_zone: session.time_zone,
            stream_id: stream.id,
          )
          stream_hourly_averages_recalculator.call(
            measurements: fixed_measurements,
            stream_id: stream.id,
          )
        end

        update_session_end_timestamps(session, fixed_measurements)
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
                :stream_hourly_averages_recalculator,
                :fixed_sessions_repository,
                :cutoff

    def parse_params(data, compression, user_id)
      params_parser.call(data: data, compression: compression, user_id: user_id)
    end

    # `time` here is a local wall clock, the same reading FixedMeasurementsCreator
    # stores verbatim, so it has to be read in the session zone before it can be
    # compared with `finished_at`. ParamsParser has already dropped anything
    # unparseable.
    #
    # Parsed in a fixed UTC zone, not with bare `Time.parse`: that builds the Time
    # in the OS zone, and `from_local_as_utc` then reads h/m/s off it. Ansible pins
    # the servers to Etc/UTC (`roles/bootstrap/*/tasks/timezone.yml`), so the two
    # agree today — but under any zone with DST a reading inside the spring-forward
    # gap comes back an hour later than it was written, which is the one hour of
    # the year this comparison must not be wrong about. UTC has no gap.
    def reject_after_finish(session, measurements)
      cutoff.call(session: session, measurements: measurements) do |m|
        Utils.from_local_as_utc(UTC.parse(m[:time]), session.time_zone)
      end
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
  end
end
