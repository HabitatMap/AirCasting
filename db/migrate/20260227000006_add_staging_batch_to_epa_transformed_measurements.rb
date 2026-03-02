class AddStagingBatchToEpaTransformedMeasurements < ActiveRecord::Migration[7.0]
  def up
    remove_index :epa_transformed_measurements, name: 'idx_epa_transformed_batch_id'
    rename_column :epa_transformed_measurements, :epa_ingest_batch_id, :epa_staging_batch_id
    add_index :epa_transformed_measurements, :epa_staging_batch_id,
              name: 'idx_epa_transformed_staging_batch_id'
  end

  def down
    remove_index :epa_transformed_measurements, name: 'idx_epa_transformed_staging_batch_id'
    rename_column :epa_transformed_measurements, :epa_staging_batch_id, :epa_ingest_batch_id
    add_index :epa_transformed_measurements, :epa_ingest_batch_id,
              name: 'idx_epa_transformed_batch_id'
  end
end
