class AddStationToStationStreams < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    execute "SET lock_timeout = '3s'"
    add_column :station_streams, :station_id, :bigint, null: true

    add_index :station_streams, :station_id,
              algorithm: :concurrently,
              if_not_exists: true

    # Two steps, so the scan of existing rows never runs under the strong lock.
    # Adding the key NOT VALID takes SHARE ROW EXCLUSIVE on both tables (blocks
    # writes) but only for the metadata change; new and updated rows are checked
    # from then on. Validating then scans under SHARE UPDATE EXCLUSIVE, which
    # lets reads and writes continue. Without a DDL transaction each statement
    # commits on its own, so the strong lock is released before the scan.
    #
    # Safe in the same migration here: the column is brand new, every existing
    # row is NULL and NULL always passes, so the scan cannot fail.
    add_foreign_key :station_streams, :stations, validate: false
    validate_foreign_key :station_streams, :stations
  end

  def down
    remove_foreign_key :station_streams, :stations
    remove_index :station_streams, :station_id, if_exists: true
    remove_column :station_streams, :station_id
  end
end
