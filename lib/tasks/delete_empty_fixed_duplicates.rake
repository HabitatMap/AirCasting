# Removes duplicate FIXED sessions, but only ones that are provably empty.
#
# All 91 duplicate fixed groups in production (202 rows, created 2022-07 to
# 2025-05) are abandoned setup attempts: no streams, no measurements, no
# session_token, no device. They exist because someone tapped "create" twice while
# configuring an AirBeam, and they block the unique index on sessions.uuid.
#
# A fixed session that holds anything is a different problem and is never touched
# here:
#   * its data lives in `fixed_measurements`, not `measurements`, and
#     `FixedMeasurement` has no counter cache, so a naive fingerprint reads zero
#     for both copies and calls them identical;
#   * a `session_token` is flashed into AirBeam firmware over BLE and is how the
#     device authenticates every upload. Delete the copy holding the live token
#     and the hardware needs a physical re-configuration to recover;
#   * hourly/daily averages and threshold alerts hang off its streams.
#
# So the rule is simple and checked per session, not assumed: streams, fixed
# measurements, measurements, hourly averages, daily averages, threshold alerts,
# notes and session_token must all be absent. Anything else is reported.
#
# Usage:
#   bundle exec rake sessions:delete_empty_fixed_duplicates             # dry run
#   bundle exec rake sessions:delete_empty_fixed_duplicates APPLY=true
#   bundle exec rake sessions:delete_empty_fixed_duplicates LIMIT=20
#   bundle exec rake sessions:delete_empty_fixed_duplicates UUID=<uuid>
#   bundle exec rake sessions:delete_empty_fixed_duplicates MIN_AGE_DAYS=14
namespace :sessions do
  desc 'Delete duplicate fixed sessions that are provably empty (dry run unless APPLY=true)'
  task delete_empty_fixed_duplicates: :environment do
    apply = ENV['APPLY'] == 'true'
    limit = ENV['LIMIT'].presence&.to_i
    # A fixed session is empty from creation until its device uploads, so age is
    # not the safety check here — `contents` is. Kept anyway so both tasks read
    # the same way, and so a setup still in progress is left alone.
    min_age_days = ENV.fetch('MIN_AGE_DAYS', '14').to_i
    cutoff = min_age_days.days.ago

    ActiveRecord::Base.connection.execute("SET statement_timeout = '300s'")

    scope = ENV['UUID'].present? ? FixedSession.where(uuid: ENV['UUID']) : FixedSession.all
    groups =
      scope
      .group(:uuid, :user_id)
      .having('count(*) > 1')
      .order(Arel.sql('min(sessions.id)'))
      .pluck(:uuid, :user_id)
    groups = groups.first(limit) if limit

    puts "#{apply ? 'APPLYING' : 'DRY RUN'} — #{groups.size} duplicate fixed group(s), " \
         "ignoring sessions newer than #{min_age_days} day(s)"
    puts

    stats = { groups: 0, deleted: 0, skipped: [], failures: 0 }

    skip = lambda do |uuid, reason|
      stats[:skipped] << { uuid: uuid, reason: reason }
      puts "SKIP  #{uuid} — #{reason}"
    end

    groups.each do |uuid, user_id|
      # Applied only after with_uuid_lock returns; see the mobile task for why
      # counting inside the block would count uncommitted work.
      delta = nil

      begin
        Session.with_uuid_lock(uuid) do
          sessions = Session.where(uuid: uuid).order(:id).to_a

          next skip.call(uuid, 'uuid belongs to more than one user') if sessions.map(&:user_id).uniq.size > 1

          # An empty MobileSession also looks "empty", so without this a mobile
          # shell sharing the uuid could become the keeper — or be deleted as
          # though it were a fixed duplicate. Mirrors the mobile task's guard.
          unless sessions.all? { |s| s.is_a?(FixedSession) }
            next skip.call(uuid, 'uuid is shared with a mobile session')
          end

          if sessions.any? { |s| s.created_at > cutoff }
            next skip.call(uuid, "created less than #{min_age_days} day(s) ago, setup may still be in progress")
          end

          non_empty = sessions.reject { |s| EmptyFixedSession.empty?(s) }

          if non_empty.any?
            reasons = non_empty.map { |s| "##{s.id}: #{EmptyFixedSession.contents(s).join(', ')}" }
            next skip.call(uuid, "not empty — #{reasons.join(' | ')}")
          end

          keeper, *copies = sessions
          next if copies.empty?

          puts "#{apply ? 'DELETING' : 'WOULD DELETE'} #{uuid}: keeping ##{keeper.id}, removing " \
               "#{copies.map { |c| "##{c.id}" }.join(', ')} (all empty, user #{user_id})"

          if apply
            ActiveRecord::Base.transaction do
              tombstone_existed = DeletedSession.exists?(uuid: uuid, user_id: user_id)

              copies.each { |c| EmptyFixedSession.destroy_session!(c) }

              # Deleting writes a tombstone, and sync reports tombstoned uuids to
              # the apps as deleted — which would tell phones to drop the session
              # we kept.
              DeletedSession.where(uuid: uuid, user_id: user_id).delete_all unless tombstone_existed

              remaining = Session.where(uuid: uuid).count
              raise "expected 1 session for #{uuid}, found #{remaining}" unless remaining == 1
            end
          end

          delta = { groups: 1, deleted: copies.size }
        end

        delta&.each { |key, value| stats[key] += value }
      rescue StandardError => e
        # One bad group must not end the run, or the summary below never prints
        # and the record of everything already processed is lost.
        stats[:failures] += 1
        skip.call(uuid, "#{e.class}: #{e.message} — nothing was deleted for this group")
      end
    end

    puts
    puts '--- summary ---'
    puts "groups handled:   #{stats[:groups]}"
    puts "sessions #{apply ? 'deleted' : 'to delete'}: #{stats[:deleted]}"
    puts "groups skipped:   #{stats[:skipped].size}"
    stats[:skipped].each { |s| puts "  #{s[:uuid]} — #{s[:reason]}" }

    if stats[:failures].positive?
      puts
      puts "WARNING: #{stats[:failures]} group(s) raised and were not processed — check the log."
    end
    puts
    puts 'Dry run: nothing was written. Re-run with APPLY=true to delete.' unless apply
  end
end

# "Empty" is checked, never assumed: every table that can hang off a fixed session
# is counted, including the ones a fixed session uses but a mobile one does not.
module EmptyFixedSession
  def self.empty?(session)
    contents(session).empty?
  end

  # `streams.last_hourly_average_id` has a foreign key with no ON DELETE and
  # Stream destroys its hourly averages first. Unreachable here — these sessions
  # have no streams — but the reader should not have to re-derive that.
  def self.destroy_session!(session)
    session.streams.where.not(last_hourly_average_id: nil).update_all(last_hourly_average_id: nil)
    session.destroy!
  end

  def self.contents(session)
    stream_ids = session.streams.pluck(:id)

    counts = {
      'streams' => stream_ids.size,
      'notes' => session.notes.count,
      'session_token' => session.session_token.present? ? 1 : 0
    }

    if stream_ids.any?
      counts['measurements'] = Measurement.where(stream_id: stream_ids).count
      counts['fixed_measurements'] = FixedMeasurement.where(stream_id: stream_ids).count
      counts['hourly_averages'] = StreamHourlyAverage.where(stream_id: stream_ids).count
      counts['daily_averages'] = StreamDailyAverage.where(stream_id: stream_ids).count
      counts['threshold_alerts'] = ThresholdAlert.where(stream_id: stream_ids).count
    end

    counts.select { |_, count| count.positive? }.map { |name, count| "#{name}=#{count}" }
  end
end
