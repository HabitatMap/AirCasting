module DataFixes
  # Merges each UNMATCHED-<session uuid> EPA stream that has a station into the
  # one real-ref stream of the same station and measurement type, so a station
  # holds one stream per type. Run after EpaStationlessStreamsLinker, which sets
  # the station.
  #
  # The UNMATCHED stream holds history EpaDataMigrator copied from a legacy
  # session; nothing feeds it any more. The real-ref stream is the one ingest
  # feeds, and keeps its id, uuid and url_token (the web links streams by id).
  #
  # Per stream, in one transaction: drop the UNMATCHED measurements for hours
  # the target already has, move the rest to the target, widen the target's
  # measured range, delete the UNMATCHED stream and its daily averages, and
  # rebuild the target's daily averages. The target's point is kept even when
  # the UNMATCHED one is far off; those are logged.
  #
  # HAND_CHECKED adds streams checked by hand against HourlyData: the stream of
  # the old ref is merged into the new ref's stream of the same type, station
  # or not. A list of [until, ref] pairs splits the stream by date instead, each
  # piece into its own ref's stream; a piece with no hours needs no target.
  # Keyed by ref, since stream ids differ between environments.
  class EpaUnmatchedStreamsMerger
    UNMATCHED_PREFIX = 'UNMATCHED-'.freeze
    FAR_METERS = 1_000
    LOCK_TIMEOUT = '5s'.freeze

    HAND_CHECKED = {
      # Kent-S 236th. HourlyData: 0090 reports up to 2026-03-04 19:00 UTC, 0095
      # from 20:00, no hour by both; same name, point and agency in V2.
      '840530330090' => '840530330095',
      # EBAM-14. The legacy session sits at the point 840MMSC00014 was listed
      # at on 2026-01-13; production has the hours 22:00 and 23:00 UTC.
      'UNMATCHED-64c88aa6-a5f5-4f2b-bda2-25909322d4d3' => '840MMSC00014',
      # The legacy 0,0 bucket: two monitors were briefly listed at 0,0 and the
      # old job filed both under that point. HourlyData: St. Pete Midtown
      # 2025-02-06 13:00 to 02-07 11:00 UTC, Ft. Dodge 2025-06-23 22:00 to
      # 07-04 14:00, nothing in between.
      'CC0096625' => [
        [Time.utc(2025, 3, 1), '840121030028'],
        [nil, '840191870013'],
      ],
    }.freeze

    Piece =
      Struct.new(:from, :to, :ref, :targets, keyword_init: true) do
        def label
          "#{from&.to_date}..#{to&.to_date}"
        end
      end

    def initialize(
      repository: GovernmentSources::Repository.new,
      daily_averages_rebuilder:
        GovernmentSources::StationStreamDailyAveragesRebuilder.new,
      logger: Logger.new($stdout)
    )
      @repository = repository
      @daily_averages_rebuilder = daily_averages_rebuilder
      @logger = logger
    end

    # Writes nothing unless apply: true. limit caps the streams merged or split
    # in this run. Returns the count per action.
    def call(apply: false, limit: nil)
      @apply = apply
      @counts = Hash.new(0)
      source_id = repository.source_id(source_name: :epa)

      streams =
        StationStream
          .where(source_id: source_id)
          .where(
            '(station_id IS NOT NULL AND external_ref LIKE :unmatched) ' \
              'OR external_ref IN (:hand_checked)',
            unmatched: "#{UNMATCHED_PREFIX}%",
            hand_checked: HAND_CHECKED.keys,
          )
          .order(:id)
          .to_a
      log(
        "#{apply ? 'APPLY' : 'DRY RUN'}: #{streams.size} streams " \
          '(UNMATCHED with a station, or hand-checked refs)',
      )

      streams.each do |stream|
        break if limit && counts[:merge] + counts[:split] >= limit

        dated_refs = HAND_CHECKED[stream.external_ref]
        if dated_refs.is_a?(Array)
          split(stream, pieces_for(stream, source_id, dated_refs))
        else
          merge(stream, targets_for(stream, source_id))
        end
      end

      log("Summary: #{counts.sort.to_h}")
      counts
    end

    private

    attr_reader :repository, :daily_averages_rebuilder, :logger, :apply, :counts

    def targets_for(stream, source_id)
      scope =
        StationStream.where(
          source_id: source_id,
          stream_configuration_id: stream.stream_configuration_id,
        )
      into_ref = HAND_CHECKED[stream.external_ref]
      return scope.where(external_ref: into_ref).to_a if into_ref

      scope
        .where(station_id: stream.station_id)
        .where.not('external_ref LIKE ?', "#{UNMATCHED_PREFIX}%")
        .to_a
    end

    def pieces_for(stream, source_id, dated_refs)
      from = nil
      dated_refs.map do |to, ref|
        targets =
          StationStream.where(
            source_id: source_id,
            stream_configuration_id: stream.stream_configuration_id,
            external_ref: ref,
          ).to_a
        Piece.new(from: from, to: to, ref: ref, targets: targets).tap do
          from = to
        end
      end
    end

    def merge(stream, targets)
      return report(stream, :no_target) if targets.empty?
      if targets.size > 1
        return report(stream, :several_targets, "targets=#{targets.map(&:id).join(',')}")
      end

      target = targets.first
      details = "target=#{target.id} ref=#{target.external_ref}"
      distance = distance_meters(stream, target)
      details += " far=#{(distance / 1000).round}km" if distance > FAR_METERS

      if apply
        overlap, moved = merge_into(stream, target)
      else
        overlap =
          overlapping_measurements(stream.station_measurements, target).count
        moved = stream.station_measurements.count - overlap
      end

      report(stream, :merge, "#{details} moved=#{moved} dropped_overlap=#{overlap}")
    # Rolled back; the stream is left as it was for the next run. A unique
    # violation means ingest wrote an hour into the target meanwhile.
    rescue ActiveRecord::LockWaitTimeout, ActiveRecord::RecordNotUnique => e
      report(stream, :retry_later, "#{e.class.name.demodulize}: #{e.message.lines.first.strip}")
    end

    def merge_into(stream, target)
      StationStream.transaction do
        StationStream.connection.execute(
          "SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'",
        )

        overlap =
          overlapping_measurements(stream.station_measurements, target)
            .delete_all
        moved =
          stream.station_measurements.update_all(
            station_stream_id: target.id,
            updated_at: Time.current,
          )
        repository.delete_station_stream_daily_averages(stream_ids: [stream.id])
        widen_measured_range(
          target,
          stream.first_measured_at,
          stream.last_measured_at,
        )
        stream.delete
        daily_averages_rebuilder.call(stream_ids: [target.id])

        [overlap, moved]
      end
    end

    # Each piece with hours moves into its one target, as in merge; then the
    # stream is deleted, even if no piece had hours.
    def split(stream, pieces)
      filled =
        pieces.select { |piece| piece_measurements(stream, piece).exists? }
      unresolved = filled.find { |piece| piece.targets.size != 1 }
      if unresolved
        return(
          report(
            stream,
            unresolved.targets.empty? ? :no_target : :several_targets,
            "piece=#{unresolved.label} ref=#{unresolved.ref}",
          )
        )
      end

      results =
        if apply
          split_into(stream, filled)
        else
          filled.map { |piece| piece_result(stream, piece) }
        end
      details = results.map { |result| piece_details(*result) }
      report(stream, :split, details.any? ? details.join(' | ') : 'no hours')
    # Rolled back, as in merge.
    rescue ActiveRecord::LockWaitTimeout, ActiveRecord::RecordNotUnique => e
      report(stream, :retry_later, "#{e.class.name.demodulize}: #{e.message.lines.first.strip}")
    end

    def split_into(stream, pieces)
      StationStream.transaction do
        StationStream.connection.execute(
          "SET LOCAL lock_timeout = '#{LOCK_TIMEOUT}'",
        )

        results =
          pieces.map do |piece|
            target = piece.targets.first
            measurements = piece_measurements(stream, piece)
            first, last = measured_range(measurements)
            overlap = overlapping_measurements(measurements, target).delete_all
            moved =
              measurements.update_all(
                station_stream_id: target.id,
                updated_at: Time.current,
              )
            widen_measured_range(target, first, last)
            [piece, target, overlap, moved, first, last]
          end
        repository.delete_station_stream_daily_averages(stream_ids: [stream.id])
        stream.delete
        if results.any?
          daily_averages_rebuilder.call(
            stream_ids: results.map { |result| result[1].id }.uniq,
          )
        end

        results
      end
    end

    def piece_result(stream, piece)
      target = piece.targets.first
      measurements = piece_measurements(stream, piece)
      overlap = overlapping_measurements(measurements, target).count
      [
        piece,
        target,
        overlap,
        measurements.count - overlap,
        *measured_range(measurements),
      ]
    end

    def piece_details(piece, target, overlap, moved, first, last)
      [
        "piece=#{piece.label}",
        "target=#{target.id}",
        "ref=#{target.external_ref}",
        "moved=#{moved}",
        "dropped_overlap=#{overlap}",
        "first=#{first.iso8601}",
        "last=#{last.iso8601}",
      ].join(' ')
    end

    def piece_measurements(stream, piece)
      measurements = stream.station_measurements
      measurements = measurements.where(measured_at: piece.from..) if piece.from
      measurements = measurements.where(measured_at: ...piece.to) if piece.to
      measurements
    end

    def measured_range(measurements)
      measurements.pick(
        Arel.sql('MIN(measured_at)'),
        Arel.sql('MAX(measured_at)'),
      )
    end

    def overlapping_measurements(measurements, target)
      measurements.where(
        measured_at:
          StationMeasurement
            .where(station_stream_id: target.id)
            .select(:measured_at),
      )
    end

    # In SQL, so a last_measured_at that ingest writes meanwhile is kept.
    def widen_measured_range(target, first, last)
      StationStream.where(id: target.id).update_all(
        [
          'first_measured_at = LEAST(first_measured_at, :first), ' \
            'last_measured_at = GREATEST(last_measured_at, :last), ' \
            'updated_at = :now',
          { first: first, last: last, now: Time.current },
        ],
      )
    end

    def distance_meters(stream, target)
      StationStream
        .where(id: stream.id)
        .pick(
          Arel.sql(
            StationStream.sanitize_sql_array(
              [
                'ST_Distance(location::geography, ' \
                  '(SELECT location::geography FROM station_streams WHERE id = ?))',
                target.id,
              ],
            ),
          ),
        )
        .to_f
    end

    def report(stream, action, details = nil)
      counts[action] += 1
      log(
        [
          "stream=#{stream.id}",
          "ref=#{stream.external_ref}",
          "type=#{stream.stream_configuration_id}",
          action,
          details,
        ].compact.join(' '),
      )
    end

    def log(message)
      logger.info("[EpaUnmatchedStreamsMerger] #{message}")
    end
  end
end
