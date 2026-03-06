class AddBatchIdIndexesToEeaMeasurements < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :eea_raw_measurements,
              :eea_ingest_batch_id,
              algorithm: :concurrently,
              name: 'idx_eea_raw_measurements_batch_id'

    add_index :eea_transformed_measurements,
              :eea_ingest_batch_id,
              algorithm: :concurrently,
              name: 'idx_eea_transformed_measurements_batch_id'
  end
end
