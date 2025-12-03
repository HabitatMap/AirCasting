class CreateEeaTransformedMeasurements < ActiveRecord::Migration[7.0]
  def change
    create_table :eea_transformed_measurements do |t|
      t.bigint :eea_ingest_batch_id, null: false
      t.string :external_ref, null: false
      t.string :measurement_type, null: false
      t.timestamptz :measured_at, null: false
      t.float :value, null: false
      t.string :unit_symbol, null: false
      t.timestamptz :ingested_at, null: false

      t.timestamps
    end

    add_index :eea_transformed_measurements,
              %i[external_ref measurement_type measured_at],
              unique: true,
              name: 'idx_eea_transformed_measurements_unique'
  end
end
