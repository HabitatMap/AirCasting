# Stage 2 of the v3 session-list work (deploy 1, migration only — no application
# change). Purely additive: nullable, no default, nothing reads or writes it yet.
#
# `finished_at` records that a session was declared over, which is how a *mobile*
# session goes dormant — it has no observed-silence signal worth reading, unlike
# a fixed monitor whose `last_measurement_at` answers the question. The column is
# added to `sessions` rather than to one subclass because a fixed session can be
# decommissioned too, and the read predicate is the same on both.
#
# timestamptz, not the `datetime, precision: nil` used by the older columns on
# this table. Those two are `start_time_local` / `end_time_local`, naive wall
# clocks that Session exempts from time-zone conversion, and
# `last_measurement_at`, a genuine instant stored in a type that cannot say so.
# `finished_at` is an instant, and the newer tables here (station_streams,
# fixed_measurements) already use timestamptz for exactly that. The mixed types
# are a feature at the boundary: comparing `finished_at` to `end_time_local`
# forces the zone to be named, which is the conversion that must happen anyway.
#
# Locks: ACCESS EXCLUSIVE on `sessions` for the catalog update only. On PG 14 a
# nullable column with no default does not rewrite the table, so the lock is *held*
# for microseconds. The cost is in acquiring it: the request waits for every query
# already running on `sessions`, and Postgres orders the lock queue, so each query
# arriving during that wait queues behind the ALTER rather than overtaking it. One
# slow scan — or one connection left idle-in-transaction after touching `sessions`
# — turns an instant migration into a read outage on the hottest table here (~460M
# pkey scans since the last stats reset).
#
# lock_timeout bounds that to 3s per attempt. Retried rather than raised on the
# first miss: a single attempt makes a transient blocker fail the whole deploy,
# which is safe but needlessly manual. Five attempts over ~20s clear anything but
# a genuinely stuck transaction, and that one *should* stop the deploy.
#
# disable_ddl_transaction! is what makes the retry possible: inside Rails' default
# DDL transaction the failed ALTER poisons it, and every later statement — the
# retry included — dies with PG::InFailedSqlTransaction. Safe here because the
# migration is a single statement, so there is no partial state to roll back.
#
# No index, so no CONCURRENTLY.
#
# User-visible effect: none.
# Rollback: `ignored_columns` in one deploy, `remove_column` in a later one.
class AddFinishedAtToSessions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  LOCK_TIMEOUT = '3s'.freeze
  ATTEMPTS = 5
  BACKOFF = 5

  def up
    with_bounded_lock do
      add_column :sessions, :finished_at, :timestamptz, null: true, if_not_exists: true
    end
  end

  def down
    with_bounded_lock { remove_column :sessions, :finished_at, if_exists: true }
  end

  private

  # ActiveRecord::LockWaitTimeout is the mapping for SQLSTATE 55P03, which is what
  # lock_timeout raises. if_not_exists / if_exists on the caller keep a retry after
  # a partially-observed failure idempotent.
  def with_bounded_lock
    execute "SET lock_timeout = '#{LOCK_TIMEOUT}'"

    attempt = 0
    begin
      yield
    rescue ActiveRecord::LockWaitTimeout
      attempt += 1
      raise if attempt >= ATTEMPTS

      say "lock on sessions not available after #{LOCK_TIMEOUT}, retry #{attempt}/#{ATTEMPTS - 1}"
      sleep BACKOFF
      retry
    ensure
      execute 'SET lock_timeout = DEFAULT'
    end
  end
end
