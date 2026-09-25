# Stage 3 of the v3 session-list work. Run once, after the Stage 2 migration and
# before Stage 4 exposes the `status` filter — otherwise `?status=active` returns
# every mobile session a user has ever recorded.
#
# Every legacy mobile session is a complete recording uploaded in one shot by
# SessionBuilder, which appends nothing afterwards, so all of them are finished.
# A v3 mobile session can legitimately be mid-recording, and finishing one here
# would arm the Stage 4b cutoff against its own phone — every later measurement
# silently dropped. They are excluded below rather than assumed absent: the v3
# mobile API has been on master since 42101b186 (2026-09-18).
#
#   bundle exec rake sessions:backfill_finished_at DRY_RUN=1
#   bundle exec rake sessions:backfill_finished_at MAX_ID=50000
#   bundle exec rake sessions:backfill_finished_at
#
# A rake task, not a migration: a migration holds its transaction open for the
# whole run, and cannot be paused, resumed, or aborted without losing the work.
#
# Resumable by construction — `finished_at IS NULL` is removed by the UPDATE that
# matches it, so a killed run continues where it stopped with no bookkeeping.
namespace :sessions do
  desc 'Backfill sessions.finished_at for pre-v3 mobile sessions (Stage 3)'
  task backfill_finished_at: :environment do
    batch_size = Integer(ENV.fetch('BATCH_SIZE', 1_000))
    pause = Float(ENV.fetch('SLEEP', 0.25))
    retries = Integer(ENV.fetch('RETRIES', 5))
    dry_run = ENV['DRY_RUN'].present?

    # Interpolated into SET, which takes no bind parameters, so the value is
    # checked rather than trusted. A malformed one would otherwise surface as a
    # syntax error from a statement that looks nothing like the operator's typo.
    lock_timeout = ENV.fetch('LOCK_TIMEOUT', '3s')
    unless lock_timeout.match?(/\A\d+\s*(us|ms|s|min|h|d)?\z/)
      abort("LOCK_TIMEOUT must be a Postgres interval such as '3s' or '500ms', got #{lock_timeout.inspect}")
    end

    # ENV.key?, not .presence: MAX_ID="" would otherwise parse to 0, bound the run
    # to nothing, and report success having written nothing at all.
    id_ceiling = nil
    if ENV.key?('MAX_ID')
      raw = ENV['MAX_ID'].to_s
      unless raw.match?(/\A\d+\z/) && raw.to_i.positive?
        abort("MAX_ID must be a positive integer, got #{raw.inspect}")
      end
      id_ceiling = raw.to_i
    end

    # One relation is the single source of truth for the count, the pre-flight and
    # the iteration, so the progress report cannot disagree with what is written —
    # which is exactly what happens when the ceiling is applied in two places.
    scope = MobileSession.where(finished_at: nil).where.not(end_time_local: nil)
    scope = scope.where(id: ..id_ceiling) if id_ceiling

    # The v3 exclusion. `sensor_type_id` is the marker MobileSessions::Creator
    # already uses to tell its own rows from SessionBuilder's in the same uuid
    # space — legacy streams leave it NULL. The anti-join reads
    # idx_streams_session_sensor_type_id, which is partial on
    # `sensor_type_id IS NOT NULL` and therefore holds v3 streams only.
    scope =
      scope.where(
        'NOT EXISTS (SELECT 1 FROM streams s WHERE s.session_id = sessions.id ' \
        'AND s.sensor_type_id IS NOT NULL)',
      )

    # An unrecognised zone raises mid-batch and kills the run after partial work.
    # Cheap to rule out once up front; the set can only grow, so this is checked
    # on every run rather than trusted from an earlier one.
    bad_zones =
      scope
        .where('NOT EXISTS (SELECT 1 FROM pg_timezone_names n WHERE n.name = sessions.time_zone)')
        .distinct
        .pluck(:time_zone)

    if bad_zones.any?
      abort(
        "Aborting: #{bad_zones.size} time_zone value(s) Postgres does not " \
        "recognise, which would raise mid-batch:\n  #{bad_zones.join("\n  ")}",
      )
    end

    total = scope.count
    if total.zero?
      puts 'Nothing to backfill.'
      next
    end

    puts "#{total} mobile sessions to finish"
    puts "Bounded to id <= #{id_ceiling} (MAX_ID)" if id_ceiling
    puts "Batch #{batch_size}, pause #{pause}s, lock_timeout #{lock_timeout}, retries #{retries}"

    if dry_run
      puts 'DRY_RUN set — no rows written.'
      next
    end

    conn = ActiveRecord::Base.connection
    conn.execute("SET lock_timeout = '#{lock_timeout}'")

    started_at = Time.current
    done = 0

    begin
      # in_batches cursors on the primary key (`id > last ORDER BY id LIMIT n`),
      # so it walks the pkey index forward and never re-reads a range it has
      # passed — including on a resumed run, where the rows it already finished
      # have dropped out of the scope.
      scope.in_batches(of: batch_size) do |batch|
        attempt = 0

        begin
          # `end_time_local` is a naive wall clock — Session exempts it from
          # time-zone conversion, so the stored value is "14:32, wherever the
          # device was" and the zone lives in sessions.time_zone. `timestamp AT
          # TIME ZONE zone` reads it in that zone and yields timestamptz, which is
          # what finished_at is. Without the conversion the error is systematic
          # per region and up to ±14h.
          #
          # update_all, not save: touching `version` would push 246k sessions to
          # every syncing client, and `updated_at` would lose the real
          # modification history for no gain.
          #
          # The batch relation keeps the scope's conditions, so `finished_at IS
          # NULL` is re-checked at write time and a row finished by someone else
          # between the SELECT and the UPDATE is left alone.
          updated =
            batch.update_all('finished_at = end_time_local AT TIME ZONE time_zone')
        rescue ActiveRecord::LockWaitTimeout
          # The UPDATE takes ROW EXCLUSIVE on the table and row locks on what it
          # matches; it conflicts only with a concurrent writer on the same rows —
          # a mobile sync bumping `version`. Bounded and retried so one such row
          # cannot park the run.
          attempt += 1
          raise if attempt >= retries

          puts "  batch locked, retry #{attempt}/#{retries - 1}"
          sleep pause * 4
          retry
        end

        done += updated
        elapsed = Time.current - started_at
        rate = elapsed.positive? ? done / elapsed : 0
        eta = rate.positive? ? "#{((total - done) / rate).round}s" : '?'

        puts format(
          '%<done>d/%<total>d (%<pct>.1f%%) — ~%<eta>s left',
          done: done, total: total, pct: done * 100.0 / total, eta: eta,
        )

        sleep pause
      end
    ensure
      conn.execute('SET lock_timeout = DEFAULT')
    end

    puts "Finished #{done} sessions in #{(Time.current - started_at).round}s."
    puts 'Now run, on the database: VACUUM (ANALYZE) sessions;'
  end
end
