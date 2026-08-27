# Removes MOBILE sessions that share a uuid with another session of the same user.
#
# Background: until Session.with_uuid_lock, two uploads arriving in the same
# second could both pass the uniqueness check and insert, producing identical
# copies of one recording. A unique index on sessions.uuid cannot be added while
# those copies exist.
#
# Mobile only, deliberately. Fixed sessions store their data in
# `fixed_measurements` and can carry a `session_token` that is flashed into
# AirBeam firmware, so deleting one is a different problem with different risks —
# see sessions:delete_empty_fixed_duplicates.
#
# Safety rules:
#   * a group is skipped unless every copy belongs to one user;
#   * a copy is deleted only when it is provably identical to the keeper: same
#     editable fields, same streams, same measurement count (COUNT(*), not the
#     counter cache, which is known to drift), and the same md5 over every
#     measurement's time and value;
#   * recent sessions are left alone, because mobile measurements are inserted by
#     Sidekiq after the upload responds — fingerprinting one mid-flight would
#     compare an incomplete session;
#   * a tombstone means the user deleted the session and a sync re-uploaded it, so
#     every copy goes and the tombstone stays — but only when all copies post-date
#     it. Otherwise the group is reported, not guessed at;
#   * each group is handled under the same advisory lock the API uses, so a create
#     racing the cleanup waits instead of slipping a fresh copy behind it.
#
# Two known races, both left alone deliberately:
#   * the fingerprint and both md5 digests run while the lock is held. Measured on
#     production: median duplicate session 3.3k measurements (~20 ms), the single
#     worst 197k across its streams (~2 s). SessionBuilder waits 3 s before giving
#     up, so only that outlier could push a concurrent upload of the same uuid to a
#     400 — and the app retries on its next sync. Computing the digests before
#     taking the lock would halve nothing and double the reads;
#   * Api::ToUserSessionsHash2#delete_sessions writes tombstones without taking
#     this lock, so a user deleting a session in the same instant a group is being
#     processed could have their tombstone removed by the delete_all below, leaving
#     the phone holding a session they deleted. Their next delete fixes it. Closing
#     it means putting a lock in the legacy sync path, which is out of scope here.
#
# Cost on the apps: the keeper's version is bumped, which puts it in that user's
# next sync `download` list — one empty.json request per deduped uuid, sequential
# in both apps. A user with many groups therefore pays for all of them on one
# sync, so work through production in LIMIT batches rather than a single sweep.
#
# Usage:
#   bundle exec rake sessions:deduplicate_mobile               # dry run
#   bundle exec rake sessions:deduplicate_mobile APPLY=true    # delete
#   bundle exec rake sessions:deduplicate_mobile LIMIT=20      # first N groups
#   bundle exec rake sessions:deduplicate_mobile UUID=<uuid>   # one group
#   bundle exec rake sessions:deduplicate_mobile MIN_AGE_DAYS=14
namespace :sessions do
  desc 'Deduplicate mobile sessions sharing a uuid (dry run unless APPLY=true)'
  task deduplicate_mobile: :environment do
    apply = ENV['APPLY'] == 'true'
    limit = ENV['LIMIT'].presence&.to_i
    min_age_days = ENV.fetch('MIN_AGE_DAYS', '7').to_i
    throttle = ENV.fetch('THROTTLE', apply ? '0.1' : '0').to_f
    cutoff = min_age_days.days.ago

    # Generous, so the initial aggregate and the largest delete both fit, but not
    # unlimited — a runaway statement should fail rather than sit on the database.
    ActiveRecord::Base.connection.execute("SET statement_timeout = '300s'")

    scope = ENV['UUID'].present? ? MobileSession.where(uuid: ENV['UUID']) : MobileSession.all
    # Ordered so LIMIT means the same groups on every run: dry-run a batch, then
    # apply exactly that batch. Oldest first.
    groups =
      scope
        .group(:uuid, :user_id)
        .having('count(*) > 1')
        .order(Arel.sql('min(sessions.id)'))
        .pluck(:uuid, :user_id)
    groups = groups.first(limit) if limit

    puts "#{apply ? 'APPLYING' : 'DRY RUN'} — #{groups.size} duplicate mobile group(s), " \
         "ignoring sessions newer than #{min_age_days} day(s)"
    puts

    stats = { groups: 0, deleted: 0, measurements_freed: 0, honoured_deletes: 0, skipped: [], failures: 0 }

    skip = lambda do |uuid, ids, reason|
      stats[:skipped] << { uuid: uuid, ids: ids, reason: reason }
      puts "SKIP  #{uuid} — #{reason}"
    end

    groups.each_with_index do |(uuid, user_id), index|
      puts "  … #{index}/#{groups.size} groups processed" if index.positive? && (index % 50).zero?
      group_ids = []
      # Collected inside the lock, added to the totals only after with_uuid_lock
      # returns — that block IS the transaction, so until it returns nothing is
      # committed. The inner ActiveRecord::Base.transaction below nests inside it
      # and opens no savepoint, so counting there would count uncommitted work.
      delta = nil

      begin
        Session.with_uuid_lock(uuid) do
          # Everything with this uuid, not just this user's rows: a uuid shared by
          # two users is a state nothing here should act on.
          sessions = Session.where(uuid: uuid).order(:id).to_a
          group_ids = sessions.map(&:id)

          if sessions.map(&:user_id).uniq.size > 1
            next skip.call(uuid, group_ids, 'uuid belongs to more than one user')
          end

          if sessions.any? { |s| !s.is_a?(MobileSession) }
            next skip.call(uuid, group_ids, 'uuid is shared with a fixed session')
          end

          next if sessions.size < 2

          if sessions.any? { |s| s.created_at > cutoff }
            next skip.call(uuid, group_ids,
                           "created less than #{min_age_days} day(s) ago, measurements may still be arriving")
          end

          keeper, *copies = sessions
          tombstone = DeletedSession.find_by(uuid: uuid, user_id: user_id)

          if tombstone
            if sessions.any? { |s| s.created_at <= tombstone.created_at }
              next skip.call(uuid, group_ids, 'session(s) predate the tombstone, needs a human')
            end

            freed = sessions.sum { |s| MobileSessionFingerprint.measurement_count(s) }
            puts "#{apply ? 'DELETING' : 'WOULD DELETE ALL'} #{uuid}: user #{user_id} deleted this " \
                 "session, removing #{sessions.map { |s| "##{s.id}" }.join(', ')} (#{freed} measurement(s)); " \
                 'tombstone kept'

            if apply
              ActiveRecord::Base.transaction do
                sessions.each { |s| MobileSessionFingerprint.destroy_session!(s) }
                raise "sessions remain for #{uuid}" if Session.where(uuid: uuid).exists?
                raise "tombstone for #{uuid} vanished" unless DeletedSession.exists?(uuid: uuid, user_id: user_id)
              end
            end

            delta = { groups: 1, deleted: sessions.size, measurements_freed: freed, honoured_deletes: 1 }
            next
          end

          keeper_print = MobileSessionFingerprint.for(keeper)
          identical, differing = copies.partition { |c| MobileSessionFingerprint.for(c) == keeper_print }

          if differing.any?
            # Partial deletion helps nothing — the uuid still has two or more rows,
            # so the unique index stays blocked — and it leaves behind a group
            # nobody has understood. Leave the whole group alone.
            next skip.call(uuid, differing.map(&:id), 'copies are not identical to the keeper')
          end

          # Proof, not just shape: the fingerprint cannot see a difference in the
          # middle of a stream. Runs in a dry run too, so what an operator approves
          # is what an apply will actually do.
          keeper_digest = MobileSessionFingerprint.digest(keeper)
          unverified = identical.reject { |c| MobileSessionFingerprint.digest(c) == keeper_digest }

          next skip.call(uuid, unverified.map(&:id), 'measurement checksums differ') if unverified.any?

          # The per-stream counts are already in the fingerprint; no need to count
          # the same rows a third time.
          freed = identical.size * MobileSessionFingerprint.measurement_total(keeper_print)
          # The bump is named in the dry run too: the keeper used to be read-only,
          # and an operator approving a dry run has to be approving what apply does.
          puts "#{apply ? 'DELETING' : 'WOULD DELETE'} #{uuid}: keeping ##{keeper.id} " \
               "(version #{keeper.version.to_i} → #{keeper.version.to_i + 1}), removing " \
               "#{identical.map { |c| "##{c.id}" }.join(', ')} (#{freed} measurement(s), user #{user_id})"

          if apply
            ActiveRecord::Base.transaction do
              tombstone_existed = DeletedSession.exists?(uuid: uuid, user_id: user_id)

              identical.each { |c| MobileSessionFingerprint.destroy_session!(c) }

              # Undo the tombstone our own deletion caused, or the next sync tells
              # every phone that the session we just kept was deleted.
              DeletedSession.where(uuid: uuid, user_id: user_id).delete_all unless tombstone_existed

              remaining = Session.where(uuid: uuid).count
              raise "expected 1 session for #{uuid}, found #{remaining}" unless remaining == 1

              # Session.find, not keeper.reload: acts-as-taggable-on memoises
              # tag_list and reload does not clear it, so a concurrent tag edit
              # would slip past the check.
              unless MobileSessionFingerprint.for(Session.find(keeper.id)) == keeper_print
                raise "keeper ##{keeper.id} changed while the group was being processed"
              end

              # Last, and only after that assertion — `version` is part of the
              # fingerprint, so bumping earlier would trip our own check.
              #
              # The create response returns `location`, a URL built from
              # `url_token`, which is per row rather than per uuid. Both phones
              # store it against the uuid and share from it, and a race gave them
              # whichever copy answered last — possibly the one just deleted, which
              # would leave a dead share link. Sync only re-downloads a session
              # whose server version is ahead of the phone's, so the bump is what
              # makes the app ask again and pick up the surviving token.
              # to_i, not +1: `sessions.version` is nullable (default 1 applies to
              # inserts only), and a NoMethodError here would roll back a perfectly
              # good delete.
              keeper.update_column(:version, keeper.version.to_i + 1)
            end
          end

          delta = { groups: 1, deleted: identical.size, measurements_freed: freed, honoured_deletes: 0 }
        end

        delta&.each { |key, value| stats[key] += value }
      rescue StandardError => e
        # One unexpected group must not end the run. The transaction has already
        # rolled back and the lock is released, so this group is untouched, and
        # `delta` is never applied.
        stats[:failures] += 1
        skip.call(uuid, group_ids, "#{e.class}: #{e.message} — nothing was deleted for this group")
      end

      # Outside the lock: sleeping inside it would hold the advisory lock and the
      # row locks for everything just deleted.
      sleep(throttle) if throttle.positive?
    end

    puts
    puts '--- summary ---'
    puts "groups handled:      #{stats[:groups]}"
    puts "sessions #{apply ? 'deleted' : 'to delete'}:    #{stats[:deleted]}"
    puts "measurements #{apply ? 'freed' : 'to free'}: #{stats[:measurements_freed]}"
    puts "deleted outright:    #{stats[:honoured_deletes]} (user had deleted the session)"
    puts "groups skipped:      #{stats[:skipped].size}"
    stats[:skipped].each { |s| puts "  #{s[:uuid]} — #{s[:reason]} (ids #{s[:ids].join(', ')})" }

    if stats[:failures].positive?
      puts
      puts "WARNING: #{stats[:failures]} group(s) raised and were not processed (see the error classes " \
           'above) — check the log before treating this run as complete.'
    end
    puts
    puts 'Dry run: nothing was written. Re-run with APPLY=true to delete.' unless apply
  end
end

module MobileSessionFingerprint
  # What a session looks like, including the fields a user can edit. A rename, a
  # new tag or an extra note makes the copies differ, so the group is reported
  # instead of silently discarding somebody's edit.
  def self.for(session)
    [
      session.title,
      session.tag_list.to_s,
      session.contribute,
      session.is_indoor,
      session.start_time_local,
      session.end_time_local,
      session.time_zone,
      session.device_id,
      # Session#sync bumps this on every edit, and Api::UpdateSession resolves its
      # target with an unordered find_by_uuid — so an edit lands on an arbitrary
      # copy. Differing versions is the cheapest signal that one copy was touched,
      # and it catches edits the field list misses (a note's text changing while
      # notes.count stays equal).
      session.version,
      notes_shape(session),
      streams_shape(session),
    ]
  end

  # Number, text and photo, not just the count. Two copies can carry the same
  # number of notes with different text, and SessionBuilder attaches photos at
  # upload time — so one copy can hold the photo and the other not. Comparing
  # counts alone would call those identical and destroy the only copy of a photo.
  #
  # Ordered by (number, text) rather than number alone: `notes.number` is
  # nullable and Postgres does not order ties among NULLs, so two copies could
  # pluck the same notes in different orders and falsely mismatch.
  def self.notes_shape(session)
    session
      .notes
      .includes(s3_photo_attachment: :blob) # otherwise one query per note
      .sort_by { |note| [note.number ? 0 : 1, note.number.to_i, note.text.to_s] }
      .map { |note| [note.number, note.text, note.s3_photo.attached? ? note.s3_photo.blob.checksum : nil] }
  end

  def self.streams_shape(session)
    session.streams.order(:sensor_name, :sensor_package_name).map do |stream|
      # COUNT(*) rather than measurements_count: the counter cache is known to
      # drift (see sync_measurements_counter.rake).
      count = Measurement.where(stream_id: stream.id).count
      first_at, last_at =
        Measurement.where(stream_id: stream.id).reorder(nil).pick(Arel.sql('MIN(time)'), Arel.sql('MAX(time)'))

      # Api::CreateThresholdAlert resolves its stream by uuid and sensor name, so
      # with duplicates around an alert can be attached to any copy — and
      # `Stream has_many :threshold_alerts, dependent: :destroy` would take it
      # down with that copy, silently. Counting them here turns that into a
      # reported skip. No mobile stream in production carries one today.
      alerts = ThresholdAlert.where(stream_id: stream.id).count

      [stream.sensor_name, stream.sensor_package_name, stream.unit_symbol, count, first_at, last_at, alerts]
    end
  end

  # Total measurements described by a fingerprint — the counts are already there.
  def self.measurement_total(print)
    print.last.sum { |stream_tuple| stream_tuple[3] }
  end

  def self.measurement_count(session)
    Measurement.where(stream_id: session.streams.select(:id)).count
  end

  # md5 over every measurement of the session — proof two copies carry the same
  # data, not merely the same shape.
  def self.digest(session)
    session.streams.order(:sensor_name, :sensor_package_name).map do |stream|
      checksum =
        ActiveRecord::Base.connection.select_value(
          ActiveRecord::Base.sanitize_sql_array(
            [
              "SELECT md5(coalesce(string_agg(m.time::text || ':' || coalesce(m.value::text, '') || ':' || " \
              "coalesce(m.latitude::text, '') || ':' || coalesce(m.longitude::text, ''), ',' " \
              'ORDER BY m.time, m.value, m.latitude, m.longitude), \'\')) ' \
              'FROM measurements m WHERE m.stream_id = ?',
              stream.id,
            ],
          ),
        )

      [stream.sensor_name, stream.sensor_package_name, checksum]
    end
  end

  # `streams.last_hourly_average_id` has a foreign key with no ON DELETE, and
  # Stream destroys its hourly averages first — so clear the pointer before the
  # destroy, exactly as every other delete path in the app does.
  def self.destroy_session!(session)
    session.streams.where.not(last_hourly_average_id: nil).update_all(last_hourly_average_id: nil)
    session.destroy!
  end
end
