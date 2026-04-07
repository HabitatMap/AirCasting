module FixedSessions
  module BinaryProtocol
    class Ingester
      def initialize(
        parser: Parser.new,
        streams_repository: StreamsRepository.new,
        fixed_measurements_repository: FixedMeasurementsRepository.new,
        fixed_sessions_repository: FixedSessionsRepository.new,
        daily_averages_recalculator: FixedStreaming::StreamDailyAveragesRecalculator.new,
        hourly_averages_recalculator: FixedStreaming::StreamHourlyAveragesRecalculator.new
      )
        @parser = parser
        @streams_repository = streams_repository
        @fixed_measurements_repository = fixed_measurements_repository
        @fixed_sessions_repository = fixed_sessions_repository
        @daily_averages_recalculator = daily_averages_recalculator
        @hourly_averages_recalculator = hourly_averages_recalculator
      end

      def call(session:, binary:)
        measurements = parser.call(binary)
      rescue Parser::ParseError => e
        return Failure.new(error_code: e.error_code, message: e.message)
      else
        ingest(session: session, measurements: measurements)
      end

      private

      attr_reader :parser, :streams_repository, :fixed_measurements_repository,
                  :fixed_sessions_repository, :daily_averages_recalculator,
                  :hourly_averages_recalculator

      def ingest(session:, measurements:)
        grouped = measurements.group_by { |m| m[:sensor_type_id] }
        stream_records = {}
        oldest_epoch = measurements.min_by { |m| m[:epoch] }[:epoch]

        ActiveRecord::Base.transaction do
          all_records = []

          grouped.each do |type_id, type_measurements|
            stream = streams_repository.find_by_session_id_and_sensor_type_id(
              session_id: session.id,
              sensor_type_id: type_id,
            )
            return Failure.new(error_code: ErrorCodes::UNKNOWN_SENSOR_TYPE_ID, message: "sensor_type_id #{type_id} is not registered for this session") unless stream

            records = build_records(type_measurements, session, stream)
            fixed_measurements_repository.import(measurements: records, on_duplicate_key_ignore: true)
            all_records.concat(records)
            stream_records[type_id] = { stream: stream, records: records }
          end

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
        Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
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
