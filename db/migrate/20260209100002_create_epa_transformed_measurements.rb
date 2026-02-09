class CreateEpaTransformedMeasurements < ActiveRecord::Migration[7.0]
  def change
    create_table :epa_transformed_measurements do |t|
      t.bigint :epa_ingest_batch_id, null: false
      t.string :external_ref, null: false
      t.string :measurement_type, null: false
      t.timestamptz :measured_at, null: false
      t.float :value, null: false
      t.string :unit_symbol, null: false
      t.timestamptz :ingested_at, null: false

      t.timestamps
    end

    add_index :epa_transformed_measurements,
              %i[external_ref measurement_type measured_at],
              unique: true,
              name: 'idx_epa_transformed_measurements_unique'

    add_index :epa_transformed_measurements, :epa_ingest_batch_id,
              name: 'idx_epa_transformed_batch_id'

    add_index :epa_transformed_measurements, :ingested_at,
              name: 'idx_epa_transformed_ingested_at'
  end
end
