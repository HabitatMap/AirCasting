module MobileSessions
  module BinaryProtocol
    # Ingests parsed mobile binary frames into `measurements`, then folds the batch
    # into the stream aggregates and the session bounds.
    #
    # Resends are expected, so ingest is idempotent. `measurements` has no unique
    # constraint on (stream_id, time), so that dedup is a read followed by a write
    # and holds only under the per-stream advisory lock.
    class Ingester
      # 0x4D454153 == "MEAS", so a stream id cannot collide with an unrelated
      # advisory lock elsewhere in the cluster.
      ADVISORY_LOCK_NAMESPACE = 0x4D454153

      # pg_advisory_xact_lock waits forever by default, and production runs 16
      # single-request unicorn workers, so a queued upload holds a whole worker.
      # Shorter than the creators' 3s: an upload is idempotent and the client
      # re-sends it, while a rejected create costs the user a session.
      LOCK_TIMEOUT = '1s'.freeze

      # Above this average gap between frames, a range scan stops being the cheaper
      # way to ask. Mobile sampling is 1s / 5s / 1min / 5min / 10min.
      MAX_DENSE_SECONDS_PER_FRAME = 60

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
        # Unanswerable once the transaction is open: a plain `transaction` inside a
        # caller's joins it, so `open_transactions` reads 1 either way.
        outermost = !ActiveRecord::Base.connection.transaction_open?

        ActiveRecord::Base.transaction do
          set_lock_timeout if outermost

          ordered_by_stream_id(grouped, streams).each do |type_id, type_measurements|
            stream = streams.fetch(type_id)
            lock_stream(stream)
            # Loaded before the lock, so its aggregates may be an upload out of
            # date, and everything below writes them back.
            stream.reload

            records = reject_existing(stream, build_records(dedupe(type_measurements), session, stream, factory))
            next if records.empty?

            inserted = import(session, stream, records)
            next if inserted.empty?

            apply_stream_aggregates(stream, inserted)
            inserted_for_session.concat(inserted)
          end

          apply_session_times(session, inserted_for_session)
        end

        Success.new('measurements ingested')
      rescue ActiveRecord::RecordNotFound
        Failure.new(
          error_code: ::MobileSessions::ErrorCodes::SESSION_NOT_FOUND,
          message: 'Session not found',
        )
      rescue ActiveRecord::RecordInvalid => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(error_code: ::MobileSessions::ErrorCodes::INTERNAL_ERROR, message: e.message)
      # Before StatementInvalid, which it subclasses. Nothing is wrong with the
      # request — another upload held the stream — so it is worth retrying.
      rescue ActiveRecord::LockWaitTimeout => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(
          error_code: ::MobileSessions::ErrorCodes::TRY_AGAIN_LATER,
          message: 'Could not store these measurements, please retry',
        )
      # Deadlock, cancelled statement, connection loss. The real message goes to
      # the monitor, not the client: a PG error quotes the failing SQL and values.
      rescue ActiveRecord::StatementInvalid => e
        monitor.report_transaction_error(session: session, message: e.message)
        Failure.new(
          error_code: ::MobileSessions::ErrorCodes::INTERNAL_ERROR,
          message: 'Could not store these measurements',
        )
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

      # Two uploads touching the same pair of streams take the locks in the same
      # order and cannot deadlock.
      def ordered_by_stream_id(grouped, streams)
        grouped.sort_by { |type_id, _| streams.fetch(type_id).id }
      end

      # SET LOCAL lasts for the transaction, so a caller's transaction would keep a
      # lock_timeout it never asked for.
      def set_lock_timeout
        ActiveRecord::Base.connection.execute("SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'")
      end

      # Transaction-scoped, so it cannot leak on a pooled connection the way
      # session-scoped pg_advisory_lock would.
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

      # `reject_existing` only looks at what is stored, so a timestamp repeated
      # inside one payload would land twice. Keeps the first, as ON CONFLICT DO
      # NOTHING will once the partial unique index exists.
      def dedupe(type_measurements)
        type_measurements.uniq { |m| m[:epoch] }
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

      # Correct only under the stream's advisory lock: without it two uploads of
      # the same frames both read "absent" and both insert.
      def reject_existing(stream, records)
        return records if records.empty?

        times = records.map(&:time)
        existing =
          Measurement
            .reorder(nil) # drops Measurement's default_scope ORDER BY, unused here
            .where(stream_id: stream.id, **existing_time_filter(times, records.size))
            .pluck(:time)
            .map(&:to_i)
            .to_set
        records.reject { |record| existing.include?(record.time.to_i) }
      end

      # A range is one index scan rather than a probe per frame, but it returns
      # every stored row in the span, and the frame cap bounds how many frames a
      # batch carries, not how far apart they sit: a client resending its first and
      # last chunk together would pull the whole session into Ruby.
      def existing_time_filter(times, frame_count)
        span = times.max - times.min
        return { time: times.min..times.max } if span <= frame_count * MAX_DENSE_SECONDS_PER_FRAME

        { time: times }
      end

      # `on_duplicate_key_ignore` is a no-op until the partial unique index exists,
      # and rows it ignores are not reported in `failed_instances` — so subtracting
      # them is only correct while `reject_existing` keeps conflicts away from the
      # insert. Dropping that means reading the rows back with `returning:`.
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

      def apply_stream_aggregates(stream, records)
        previous_count = stream.measurements_count.to_i
        latitudes = records.map(&:latitude)
        longitudes = records.map(&:longitude)

        stream.update!(
          **bounding_box(stream, latitudes, longitudes, widen: previous_count.positive?),
          average_value: running_average(stream.average_value, previous_count, records.map(&:value)),
          **start_coordinates(stream),
        )

        Stream.update_counters(stream.id, measurements_count: records.size)
      end

      # The first batch replaces the single point MobileSessions::Creator seeded the
      # box with — often a stale fix, and widening from it leaves the box inflated
      # for the life of the stream, which `Stream.in_rectangle` (ST_Contains) then
      # fails to match. Later batches only widen, so an out-of-order upload cannot
      # pull the box in around the frames it happens to carry.
      def bounding_box(stream, latitudes, longitudes, widen:)
        return { min_latitude: latitudes.min, max_latitude: latitudes.max,
                 min_longitude: longitudes.min, max_longitude: longitudes.max } unless widen

        {
          min_latitude: smallest(stream.min_latitude, latitudes.min),
          max_latitude: largest(stream.max_latitude, latitudes.max),
          min_longitude: smallest(stream.min_longitude, longitudes.min),
          max_longitude: largest(stream.max_longitude, longitudes.max),
        }
      end

      # Exact for a session that starts empty, only as good as `measurements_count`
      # for anything pre-existing.
      def running_average(previous_average, previous_count, values)
        batch_sum = values.sum(0.0)
        return batch_sum / values.size if previous_average.nil? || previous_count <= 0

        ((previous_average.to_f * previous_count) + batch_sum) / (previous_count + values.size)
      end

      def start_coordinates(stream)
        latitude, longitude = stream.measurements.order(time: :asc).limit(1).pick(:latitude, :longitude)
        { start_latitude: latitude, start_longitude: longitude }
      end

      # Widen-only; nothing to replace on the first batch, as MobileSessions::Creator
      # leaves both times NULL. `lock!` because uploads for different streams of one
      # session take different advisory locks and never meet — without it the second
      # folds into the copy it loaded and overwrites the first's bounds. It raises
      # on a session carrying unsaved changes, so callers pass a freshly loaded one.
      def apply_session_times(session, records)
        return if records.empty?

        session.lock!

        times = records.map(&:time)
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
