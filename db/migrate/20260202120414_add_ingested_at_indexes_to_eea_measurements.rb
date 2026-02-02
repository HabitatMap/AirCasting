class AddIngestedAtIndexesToEeaMeasurements < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :eea_raw_measurements,
              :ingested_at,
              algorithm: :concurrently,
              name: 'idx_eea_raw_measurements_ingested_at'

    add_index :eea_transformed_measurements,
              :ingested_at,
              algorithm: :concurrently,
              name: 'idx_eea_transformed_measurements_ingested_at'
  end
end
