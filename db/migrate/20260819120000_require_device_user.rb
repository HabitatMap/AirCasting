# Phase 3 of 3 — deploy this only AFTER the application code that scopes device
# lookups to the current user is live. Until then the running code creates
# devices without an owner, and this migration would make those inserts fail.
#
# `NOT NULL` is set through a validated CHECK constraint: on PostgreSQL 12+ that
# lets `SET NOT NULL` reuse the constraint instead of re-scanning the table, and
# the scan it does perform (`VALIDATE CONSTRAINT`) only takes a SHARE UPDATE
# EXCLUSIVE lock rather than blocking reads and writes.
class RequireDeviceUser < ActiveRecord::Migration[7.0]
  def up
    say_with_time 'backfilling devices created between the phase 2 and code deploys' do
      execute <<~SQL
        UPDATE devices d
        SET user_id = owner.user_id
        FROM (
          SELECT DISTINCT ON (device_id) device_id, user_id
          FROM sessions
          WHERE device_id IS NOT NULL
          ORDER BY device_id, id
        ) owner
        WHERE owner.device_id = d.id
          AND d.user_id IS NULL
      SQL
    end

    say_with_time 'dropping any still-unowned devices no session references' do
      execute <<~SQL
        DELETE FROM devices d
        WHERE d.user_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.device_id = d.id)
      SQL
    end

    orphans = select_value('SELECT count(*) FROM devices WHERE user_id IS NULL').to_i
    if orphans.positive?
      raise "#{orphans} device(s) still have no user_id — resolve them before running this migration"
    end

    execute 'ALTER TABLE devices ADD CONSTRAINT devices_user_id_null CHECK (user_id IS NOT NULL) NOT VALID'
    execute 'ALTER TABLE devices VALIDATE CONSTRAINT devices_user_id_null'
    change_column_null :devices, :user_id, false
    execute 'ALTER TABLE devices DROP CONSTRAINT devices_user_id_null'
  end

  def down
    change_column_null :devices, :user_id, true
  end
end
