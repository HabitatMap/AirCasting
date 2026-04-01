module FixedSessions
  module AirBeamMini2
    class Ingester
      def initialize(
        parser: BinaryParser.new,
        streams_repository: StreamsRepository.new,
        fixed_measurements_repository: FixedMeasurementsRepository.new,
        fixed_sessions_repository: FixedSessionsRepository.new
      )
        @parser = parser
        @streams_repository = streams_repository
        @fixed_measurements_repository = fixed_measurements_repository
        @fixed_sessions_repository = fixed_sessions_repository
      end

      def call(session:, binary:)
        measurements = parser.call(binary)
      rescue BinaryParser::ParseError => e
        return Failure.new(base: [e.message])
      else
        ingest(session: session, measurements: measurements)
      end

      private

      attr_reader :parser, :streams_repository, :fixed_measurements_repository, :fixed_sessions_repository

      def ingest(session:, measurements:)
        grouped = measurements.group_by { |m| m[:sensor_type_id] }

        ActiveRecord::Base.transaction do
          all_records = []

          grouped.each do |type_id, type_measurements|
            stream = streams_repository.find_by_session_id_and_sensor_type_id(
              session_id: session.id,
              sensor_type_id: type_id,
            )
            return Failure.new(base: ["unknown sensor_type_id: #{type_id}"]) unless stream

            records = build_records(type_measurements, session, stream)
            fixed_measurements_repository.import(measurements: records, on_duplicate_key_ignore: true)
            all_records.concat(records)
          end

          last_measurement = all_records.max_by(&:time_with_time_zone)
          fixed_sessions_repository.update_end_timestamps!(
            session: session,
            last_measurement: last_measurement,
          )
        end

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordInvalid => e
        Failure.new(base: [e.message])
      end

      def build_records(type_measurements, session, stream)
        type_measurements.map do |m|
          local = Time.at(m[:epoch]).in_time_zone(session.time_zone)
          time_naive = Time.parse(local.strftime('%Y-%m-%d %H:%M:%S'))

          FixedMeasurement.new(
            stream_id: stream.id,
            value: m[:value],
            time: time_naive,
            time_with_time_zone: local,
          )
        end
      end
    end
  end
end
