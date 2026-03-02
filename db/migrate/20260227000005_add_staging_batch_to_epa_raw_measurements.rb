class AddStagingBatchToEpaRawMeasurements < ActiveRecord::Migration[7.0]
  def up
    remove_index :epa_raw_measurements, name: 'idx_epa_raw_measurements_batch_id'
    rename_column :epa_raw_measurements, :epa_ingest_batch_id, :epa_staging_batch_id
    add_index :epa_raw_measurements, :epa_staging_batch_id,
              name: 'idx_epa_raw_measurements_staging_batch_id'
  end

  def down
    remove_index :epa_raw_measurements, name: 'idx_epa_raw_measurements_staging_batch_id'
    rename_column :epa_raw_measurements, :epa_staging_batch_id, :epa_ingest_batch_id
    add_index :epa_raw_measurements, :epa_ingest_batch_id,
              name: 'idx_epa_raw_measurements_batch_id'
  end
end
