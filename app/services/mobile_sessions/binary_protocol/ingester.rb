module MobileSessions
  module BinaryProtocol
    # Ingests parsed mobile binary frames into the legacy `measurements` table
    # (per-point location included), then updates stream aggregates and the
    # session's start/end bounds — mirroring how FixedSessions ingest works, but
    # writing `measurements` (with location) instead of `fixed_measurements`.
    #
    # Resends are supported (the endpoint syncs measurements the AirBeam delivered
    # late), so ingest is idempotent: frames whose (stream_id, time) already exists
    # are skipped. `measurements` carries no unique constraint to lean on, so that
    # check is a read followed by a write and only holds under the per-stream
    # advisory lock taken below.
    #
    # Aggregates are folded forward from the batch rather than recomputed, so the
    # cost of an upload tracks the frames it carries, not the size of the session.
    class Ingester
      # Namespace for pg_advisory_xact_lock so a stream id cannot collide with an
      # unrelated advisory lock elsewhere in the cluster. 0x4D454153 == "MEAS".
      ADVISORY_LOCK_NAMESPACE = 0x4D454153

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
        inserted_for_session = []
        # Whether the session already has data decides how its bounds move: see
        # apply_session_times.
        had_measurements = session.streams.sum(:measurements_count).positive?

        ActiveRecord::Base.transaction do
          # Sorted by stream id so two uploads touching the same pair of streams
          # always take the locks in the same order and cannot deadlock.
          ordered_by_stream_id(grouped, streams).each do |type_id, type_measurements|
            stream = streams.fetch(type_id)
            lock_stream(stream)

            records = reject_existing(stream, build_records(type_measurements, session, stream, factory))
            next if records.empty?

            inserted = import(session, stream, records)
            next if inserted.empty?

            apply_stream_aggregates(stream, inserted)
            inserted_for_session.concat(inserted)
          end

          apply_session_times(session, inserted_for_session, widen: had_measurements)
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

      def ordered_by_stream_id(grouped, streams)
        grouped.sort_by { |type_id, _| streams.fetch(type_id).id }
      end

      # Transaction-scoped: released on commit or rollback, so it cannot leak on a
      # pooled connection the way session-scoped pg_advisory_lock would.
      def lock_stream(stream)
        ActiveRecord::Base.connection.execute(
          "SELECT pg_advisory_xact_lock(#{ADVISORY_LOCK_NAMESPACE}, #{stream.id.to_i})",
        )
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
      # Safe only because the caller holds the stream's advisory lock — without it
      # two uploads of the same frames both read "absent" and both insert.
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

      # Returns the records that actually landed. `on_duplicate_key_ignore` is a
      # no-op until the partial unique index on (stream_id, time) exists; it is in
      # place so the index can be added without a code change.
      #
      # Note rows the database ignores are *not* reported in `failed_instances`.
      # Subtracting them is only correct while `reject_existing` guarantees no
      # conflicts reach the insert — drop that and this has to read the inserted
      # rows back via `returning:`.
      def import(session, stream, records)
        result = Measurement.import(records, on_duplicate_key_ignore: true)
        if result.failed_instances.any?
          monitor.report_import_failure(
            session: session,
            stream_id: stream.id,
            failed_count: result.failed_instances.size,
            message: result.failed_instances.first&.errors&.full_messages&.join(', '),
          )
        end
        records - result.failed_instances
      end

      # Folded forward from the batch: bounds widen, the mean is a running mean
      # weighted by the row count the stream already had. Only the start
      # coordinates need a read, and that one is an index seek on
      # (stream_id, time) for a single row.
      def apply_stream_aggregates(stream, records)
        previous_count = stream.measurements_count.to_i
        latitudes = records.map(&:latitude)
        longitudes = records.map(&:longitude)

        stream.update!(
          min_latitude: smallest(stream.min_latitude, latitudes.min),
          max_latitude: largest(stream.max_latitude, latitudes.max),
          min_longitude: smallest(stream.min_longitude, longitudes.min),
          max_longitude: largest(stream.max_longitude, longitudes.max),
          average_value: running_average(stream.average_value, previous_count, records.map(&:value)),
          **start_coordinates(stream),
        )

        Stream.update_counters(stream.id, measurements_count: records.size)
      end

      # Weighted by `measurements_count`, so it is exact for a session that starts
      # empty and only as good as that counter for anything pre-existing.
      def running_average(previous_average, previous_count, values)
        batch_sum = values.sum(0.0)
        return batch_sum / values.size if previous_average.nil? || previous_count <= 0

        ((previous_average.to_f * previous_count) + batch_sum) / (previous_count + values.size)
      end

      def start_coordinates(stream)
        latitude, longitude = stream.measurements.order(time: :asc).limit(1).pick(:latitude, :longitude)
        { start_latitude: latitude, start_longitude: longitude }
      end

      # Equivalent to the MIN/MAX over every measurement this used to run, without
      # the scan. The first batch replaces the bounds the client declared at
      # session creation, which are a guess; every later batch only widens them,
      # so a late or out-of-order upload cannot pull the session in around the
      # frames it happens to carry.
      def apply_session_times(session, records, widen:)
        return if records.empty?

        times = records.map(&:time)
        return session.update!(start_time_local: times.min, end_time_local: times.max) unless widen

        session.update!(
          start_time_local: smallest(session.start_time_local, times.min),
          end_time_local: largest(session.end_time_local, times.max),
        )
      end

      def smallest(*values)
        values.compact.min
      end

      def largest(*values)
        values.compact.max
      end
    end
  end
end
