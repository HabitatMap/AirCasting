# Phase 2 of 3 (deploy 1, straight after phase 1).
#
# Gives every existing device an owner and makes `mac_address` unique per user
# instead of globally. `user_id` stays nullable until phase 3, so the currently
# deployed code — which does not know about the column — keeps working: rows it
# creates in the gap simply have no owner and are backfilled by phase 3.
#
# Order matters. The index swap has to happen before anything multiplies or
# rewrites rows: the split deliberately creates a second row with the same
# `mac_address`, and normalizing can make two users' addresses equal. Both are
# illegal while the global unique index still exists (learned the hard way in a
# local rehearsal against a copy of production).
#
# Every step is idempotent, so a re-run is harmless.
#
# `devices` holds ~49 rows, so plain index operations are the right call here:
# the ACCESS EXCLUSIVE lock lasts microseconds, whereas CONCURRENTLY would cost
# the transaction and can leave an INVALID index behind on failure.
class ScopeDeviceUniquenessToUser < ActiveRecord::Migration[7.0]
  def up
    say_with_time 'assigning each device to the owner of its earliest session' do
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
          AND d.user_id IS DISTINCT FROM owner.user_id
      SQL
    end

    say_with_time 'dropping devices no session references (owner unknowable)' do
      execute <<~SQL
        DELETE FROM devices d
        WHERE d.user_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.device_id = d.id)
      SQL
    end

    unless index_exists?(:devices, %i[user_id mac_address], unique: true)
      remove_index :devices, column: :mac_address, unique: true
      add_index :devices, %i[user_id mac_address], unique: true
    end

    say_with_time 'splitting devices shared by several users into per-user rows' do
      # Every (device, user) pair other than the owning one gets its own device
      # row, and that user's sessions are repointed at it.
      execute <<~SQL
        WITH extra_pairs AS (
          SELECT DISTINCT s.device_id, s.user_id
          FROM sessions s
          JOIN devices d ON d.id = s.device_id
          WHERE s.device_id IS NOT NULL
            AND s.user_id IS DISTINCT FROM d.user_id
        ), inserted AS (
          INSERT INTO devices (mac_address, model, name, user_id, created_at, updated_at)
          SELECT d.mac_address, d.model, d.name, e.user_id, now(), now()
          FROM extra_pairs e
          JOIN devices d ON d.id = e.device_id
          ON CONFLICT (user_id, mac_address) DO NOTHING
          RETURNING id, mac_address, user_id
        )
        UPDATE sessions s
        SET device_id = i.id
        FROM inserted i, devices d
        WHERE s.device_id = d.id
          AND d.mac_address = i.mac_address
          AND s.user_id = i.user_id
          AND s.device_id IS DISTINCT FROM i.id
      SQL
    end

    say_with_time 'merging one user\'s devices that differ only in mac_address case' do
      # Keep the oldest row of each group, repoint its sessions, drop the rest.
      # Must run before normalizing, or the upcase would violate the new index.
      execute <<~SQL
        WITH groups AS (
          SELECT id, user_id,
                 first_value(id) OVER (
                   PARTITION BY user_id, upper(btrim(mac_address)) ORDER BY id
                 ) AS keeper_id
          FROM devices
        ), dupes AS (
          SELECT id, keeper_id FROM groups WHERE id <> keeper_id
        ), repointed AS (
          UPDATE sessions s SET device_id = dupes.keeper_id
          FROM dupes WHERE s.device_id = dupes.id
          RETURNING s.id
        )
        DELETE FROM devices WHERE id IN (SELECT id FROM dupes)
      SQL
    end

    say_with_time 'normalizing mac_address (trim + upcase)' do
      execute <<~SQL
        UPDATE devices SET mac_address = upper(btrim(mac_address))
        WHERE mac_address <> upper(btrim(mac_address))
      SQL
    end
  end

  def down
    remove_index :devices, column: %i[user_id mac_address], unique: true
    # The per-user rows this migration created cannot be merged back, so the
    # pre-migration *unique* index is not restorable — a plain index keeps
    # lookups fast without failing the rollback.
    add_index :devices, :mac_address
  end
end
