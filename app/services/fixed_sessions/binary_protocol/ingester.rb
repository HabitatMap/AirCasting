module FixedSessions
  module BinaryProtocol
    class Ingester
      # pg_advisory_xact_lock is not taken here — `fixed_measurements` carries the
      # partial unique index the dedup leans on — but the session row update still
      # waits on a rival's lock, and unbounded that holds one of the 16
      # single-request unicorn workers. Same 1s as the mobile ingester.
      LOCK_TIMEOUT = '1s'.freeze

      def initialize(
        parser: Parser.new,
        streams_repository: StreamsRepository.new,
        fixed_measurements_repository: FixedMeasurementsRepository.new,
        fixed_sessions_repository: FixedSessionsRepository.new,
        daily_averages_recalculator: FixedStreaming::StreamDailyAveragesRecalculator.new,
        hourly_averages_recalculator: FixedStreaming::StreamHourlyAveragesRecalculator.new,
        monitor: ::BinaryProtocol::Monitor.new(source: ::BinaryProtocol::Monitor::FIXED)
      )
        @parser = parser
        @streams_repository = streams_repository
        @fixed_measurements_repository = fixed_measurements_repository
        @fixed_sessions_repository = fixed_sessions_repository
        @daily_averages_recalculator = daily_averages_recalculator
        @hourly_averages_recalculator = hourly_averages_recalculator
        @monitor = monitor
      end

      # How many dropped epochs travel to Sentry per reason; enough to recognise a
      # 1970 clock without carrying a 6000-frame batch into an event.
      SAMPLE_SKIPPED_EPOCHS = 5

      def call(session:, binary:)
        result = parser.call(binary)
      rescue Parser::ParseError => e
        monitor.report_parse_error(
          error_code: e.error_code,
          message: e.message,
          session: session,
          binary_size: binary.bytesize,
          measurement_count: e.measurement_count,
        )
        return Failure.new(error_code: e.error_code, message: e.message)
      else
        report_skipped_frames(session, result)
        ingest(session: session, measurements: result.measurements)
      end

      private

      attr_reader :parser, :streams_repository, :fixed_measurements_repository,
                  :fixed_sessions_repository, :daily_averages_recalculator,
                  :hourly_averages_recalculator, :monitor

      def report_skipped_frames(session, result)
        total = result.measurements.size + result.skipped.size

        result.skipped.group_by { |frame| frame[:reason] }.each do |reason, frames|
          monitor.report_skipped_frames(
            session: session,
            reason: reason,
            count: frames.size,
            total: total,
            sample_epochs: frames.first(SAMPLE_SKIPPED_EPOCHS).map { |frame| frame[:epoch] },
          )
        end
      end

      def ingest(session:, measurements:)
        # A payload whose every frame was dropped still answers 2xx: the Mini only
        # trims the batch from flash on a 2xx, and anything else leaves that batch
        # in flash being re-POSTed for the life of the device.
        return Success.new('measurements ingested') if measurements.empty?

        grouped = measurements.group_by { |m| m[:sensor_type_id] }
        stream_records = {}
        oldest_epoch = measurements.min_by { |m| m[:epoch] }[:epoch]
        known_type_ids = session.streams.pluck(:sensor_type_id)

        # Unanswerable once the transaction is open: a plain `transaction` inside a
        # caller's joins it, so `open_transactions` reads 1 either way.
        outermost = !ActiveRecord::Base.connection.transaction_open?

        ActiveRecord::Base.transaction do
          set_lock_timeout if outermost
          all_records = []

          grouped.each do |type_id, type_measurements|
            stream = streams_repository.find_by_session_id_and_sensor_type_id(
              session_id: session.id,
              sensor_type_id: type_id,
            )
            unless stream
              monitor.report_unknown_sensor_type(
                session: session,
                sensor_type_id: type_id,
                known_sensor_type_ids: known_type_ids,
              )
              next
            end

            records = build_records(type_measurements, session, stream)
            fixed_measurements_repository.import(measurements: records, on_duplicate_key_ignore: true)
            all_records.concat(records)
            stream_records[type_id] = { stream: stream, records: records }
          end

          return Success.new('measurements ingested') if all_records.empty?

          first_measurement = all_records.min_by(&:time_with_time_zone)
          last_measurement = all_records.max_by(&:time_with_time_zone)

          fixed_sessions_repository.update_end_timestamps!(
            session: session,
            last_measurement: last_measurement,
          )
          fixed_sessions_repository.update_start_time_local_if_earlier!(
            session: session,
            first_measurement: first_measurement,
          )
        end

        recalculate_averages(
          stream_records,
          session.time_zone,
          recalculate_hourly: from_previous_hour?(oldest_epoch, session.time_zone),
          recalculate_daily: from_previous_day?(oldest_epoch, session.time_zone),
        )

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordInvalid => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
      # Before StatementInvalid, which it subclasses. Nothing is wrong with the
      # request — another writer held the session — so it is worth retrying.
      rescue ActiveRecord::LockWaitTimeout => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(
          error_code: ErrorCodes::TRY_AGAIN_LATER,
          message: 'Could not store these measurements, please retry',
        )
      # Deadlock, cancelled statement, connection loss. The real message goes to
      # the monitor, not the client: a PG error quotes the failing SQL and values.
      rescue ActiveRecord::StatementInvalid => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(
          error_code: ErrorCodes::INTERNAL_ERROR,
          message: 'Could not store these measurements',
        )
      end

      # SET LOCAL lasts for the transaction, so a caller's transaction would keep a
      # lock_timeout it never asked for.
      def set_lock_timeout
        ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'")
      end

      def recalculate_averages(stream_records, time_zone, recalculate_hourly:, recalculate_daily:)
        return unless recalculate_hourly || recalculate_daily

        stream_records.each_value do |data|
          if recalculate_daily
            daily_averages_recalculator.call(
              measurements: data[:records],
              time_zone: time_zone,
              stream_id: data[:stream].id,
            )
          end

          if recalculate_hourly
            hourly_averages_recalculator.call(
              measurements: data[:records],
              stream_id: data[:stream].id,
            )
          end
        end
      end

      def from_previous_hour?(oldest_epoch, time_zone)
        Time.at(oldest_epoch).in_time_zone(time_zone) <=
          Time.current.in_time_zone(time_zone).beginning_of_hour
      end

      def from_previous_day?(oldest_epoch, time_zone)
        Time.at(oldest_epoch).in_time_zone(time_zone) <=
          Time.current.in_time_zone(time_zone).beginning_of_day
      end

      def build_records(type_measurements, session, stream)
        type_measurements.map do |m|
          utc_timestamp = Time.at(m[:epoch])
          FixedMeasurement.new(
            stream_id: stream.id,
            value: m[:value],
            time: Utils.to_local_as_utc(utc_timestamp, session.time_zone),
            time_with_time_zone: utc_timestamp.in_time_zone(session.time_zone),
          )
        end
      end
    end
  end
end
