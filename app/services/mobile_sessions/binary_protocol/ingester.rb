module MobileSessions
  module BinaryProtocol
    # Ingests parsed mobile binary frames into the legacy `measurements` table
    # (per-point location included), then refreshes stream aggregates and the
    # session's start/end bounds — mirroring how FixedSessions ingest works, but
    # writing `measurements` (with location) instead of `fixed_measurements`.
    class Ingester
      ErrorCodes = ::FixedSessions::BinaryProtocol::ErrorCodes

      def initialize(
        parser: Parser.new,
        streams_repository: StreamsRepository.new
      )
        @parser = parser
        @streams_repository = streams_repository
      end

      def call(session:, binary:)
        measurements = parser.call(binary)
      rescue Parser::ParseError => e
        Failure.new(error_code: e.error_code, message: e.message)
      else
        ingest(session: session, measurements: measurements)
      end

      private

      attr_reader :parser, :streams_repository

      def ingest(session:, measurements:)
        grouped = measurements.group_by { |m| m[:sensor_type_id] }
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        touched_streams = []
        local_times = []

        ActiveRecord::Base.transaction do
          grouped.each do |type_id, type_measurements|
            stream = streams_repository.find_by_session_id_and_sensor_type_id(
              session_id: session.id,
              sensor_type_id: type_id,
            )
            next unless stream

            records = build_records(type_measurements, session, stream, factory)
            local_times.concat(records.map(&:time))

            Measurement.import(records)
            Stream.update_counters(stream.id, measurements_count: records.size)
            touched_streams << stream
          end

          refresh_stream_aggregates(touched_streams)
          refresh_session_times(session, local_times)
        end

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordInvalid => e
        Failure.new(error_code: ErrorCodes::INTERNAL_ERROR, message: e.message)
      end

      def build_records(type_measurements, session, stream, factory)
        type_measurements.map do |m|
          utc_ts = Time.at(m[:epoch])
          Measurement.new(
            stream_id: stream.id,
            value: m[:value],
            latitude: m[:latitude],
            longitude: m[:longitude],
            location: factory.point(m[:longitude], m[:latitude]),
            time: Utils.to_local_as_utc(utc_ts, session.time_zone),
            time_with_time_zone: utc_ts.in_time_zone(session.time_zone),
          )
        end
      end

      def refresh_stream_aggregates(streams)
        streams.each do |stream|
          streams_repository.calculate_bounding_box!(stream)
          streams_repository.calculate_average_value!(stream)
          streams_repository.add_start_coordinates!(stream)
        end
      end

      def refresh_session_times(session, local_times)
        return if local_times.empty?

        first = local_times.min
        last = local_times.max
        session.end_time_local = last
        session.start_time_local = first if first < session.start_time_local
        session.save!
      end
    end
  end
end
