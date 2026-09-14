module MobileSessions
  module BinaryProtocol
    # Ingests parsed mobile binary frames into the legacy `measurements` table
    # (per-point location included), then refreshes stream aggregates and the
    # session's start/end bounds — mirroring how FixedSessions ingest works, but
    # writing `measurements` (with location) instead of `fixed_measurements`.
    #
    # Resends are supported (the endpoint syncs measurements the AirBeam delivered
    # late), so ingest is idempotent: frames whose (stream_id, time) already exists
    # are skipped. Aggregates and session bounds are recomputed with SQL so cost is
    # independent of session size.
    class Ingester

      def initialize(
        parser: Parser.new,
        streams_repository: StreamsRepository.new,
        monitor: ::BinaryProtocol::Monitor.new(source: ::BinaryProtocol::Monitor::MOBILE)
      )
        @parser = parser
        @streams_repository = streams_repository
        @monitor = monitor
      end

      def call(session:, binary:)
        measurements = parser.call(binary)
      rescue Parser::ParseError => e
        monitor.report_parse_error(
          error_code: e.error_code,
          message: e.message,
          session: session,
          binary_size: binary.bytesize,
          measurement_count: e.measurement_count,
        )
        Failure.new(error_code: e.error_code, message: e.message)
      else
        ingest(session: session, measurements: measurements)
      end

      private

      attr_reader :parser, :streams_repository, :monitor

      def ingest(session:, measurements:)
        grouped = measurements.group_by { |m| m[:sensor_type_id] }
        streams = resolve_streams(session, grouped.keys)

        unknown_type_ids = grouped.keys - streams.keys
        return reject_unknown_sensor_types(session, unknown_type_ids) if unknown_type_ids.any?

        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        touched_streams = []

        ActiveRecord::Base.transaction do
          grouped.each do |type_id, type_measurements|
            stream = streams.fetch(type_id)

            records = reject_existing(stream, build_records(type_measurements, session, stream, factory))
            next if records.empty?

            imported = import(session, stream, records)
            Stream.update_counters(stream.id, measurements_count: imported) if imported.positive?
            touched_streams << stream
          end

          refresh_stream_aggregates(touched_streams)
          refresh_session_times(session)
        end

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordInvalid => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(error_code: ::MobileSessions::ErrorCodes::INTERNAL_ERROR, message: e.message)
      end

      def resolve_streams(session, type_ids)
        type_ids.each_with_object({}) do |type_id, acc|
          stream = streams_repository.find_by_session_id_and_sensor_type_id(
            session_id: session.id,
            sensor_type_id: type_id,
          )
          acc[type_id] = stream if stream
        end
      end

      def reject_unknown_sensor_types(session, unknown_type_ids)
        known_type_ids = session.streams.pluck(:sensor_type_id)

        unknown_type_ids.each do |type_id|
          monitor.report_unknown_sensor_type(
            session: session,
            sensor_type_id: type_id,
            known_sensor_type_ids: known_type_ids,
          )
        end

        Failure.new(
          error_code: ::MobileSessions::ErrorCodes::UNSUPPORTED_SENSOR_TYPE,
          message: "session has no stream for sensor_type_id #{unknown_type_ids.sort.join(', ')}",
        )
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

      # Idempotent resend: drop frames whose (stream_id, time) already exists.
      def reject_existing(stream, records)
        return records if records.empty?

        existing =
          Measurement
            .where(stream_id: stream.id, time: records.map(&:time))
            .pluck(:time)
            .map(&:to_i)
            .to_set
        records.reject { |record| existing.include?(record.time.to_i) }
      end

      def import(session, stream, records)
        result = Measurement.import(records)
        if result.failed_instances.any?
          monitor.report_import_failure(
            session: session,
            stream_id: stream.id,
            failed_count: result.failed_instances.size,
            message: result.failed_instances.first&.errors&.full_messages&.join(', '),
          )
        end
        records.size - result.failed_instances.size
      end

      # SQL aggregates — cost independent of session size (no row materialization).
      def refresh_stream_aggregates(streams)
        streams.each do |stream|
          min_lat, max_lat, min_lng, max_lng, average = stream.measurements.reorder(nil).pick(
            Arel.sql('MIN(latitude)'), Arel.sql('MAX(latitude)'),
            Arel.sql('MIN(longitude)'), Arel.sql('MAX(longitude)'),
            Arel.sql('AVG(value)'),
          )
          start_coords = stream.measurements.order(time: :asc).limit(1).pick(:latitude, :longitude)

          stream.update!(
            min_latitude: min_lat,
            max_latitude: max_lat,
            min_longitude: min_lng,
            max_longitude: max_lng,
            average_value: average,
            start_latitude: start_coords&.first,
            start_longitude: start_coords&.last,
          )
        end
      end

      # True bounds from all of the session's measurements — correct regardless of
      # upload order or late/bulk backfill (unlike a seed-vs-batch min/max).
      def refresh_session_times(session)
        first, last = Measurement
          .where(stream_id: session.streams.select(:id))
          .reorder(nil)
          .pick(Arel.sql('MIN(time)'), Arel.sql('MAX(time)'))
        return unless first

        session.update!(start_time_local: first, end_time_local: last)
      end
    end
  end
end
