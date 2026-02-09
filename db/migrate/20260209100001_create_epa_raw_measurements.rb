class CreateEpaRawMeasurements < ActiveRecord::Migration[7.0]
  def up
    create_table :epa_raw_measurements, id: false do |t|
      t.bigint :epa_ingest_batch_id
      t.string :valid_date
      t.string :valid_time
      t.string :aqsid
      t.string :sitename
      t.string :gmt_offset
      t.string :parameter_name
      t.string :reporting_units
      t.float :value
      t.string :data_source

      t.timestamptz :ingested_at, null: false, default: -> { 'now()' }
    end

    execute 'ALTER TABLE epa_raw_measurements SET UNLOGGED'

    add_index :epa_raw_measurements, :ingested_at,
              name: 'idx_epa_raw_measurements_ingested_at'
  end

  def down
    drop_table :epa_raw_measurements
  end
end
