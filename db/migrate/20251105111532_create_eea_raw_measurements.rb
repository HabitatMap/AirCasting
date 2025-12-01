class CreateEeaRawMeasurements < ActiveRecord::Migration[7.0]
  def up
    create_table :eea_raw_measurements, id: false do |t|
      t.bigint :eea_ingest_batch_id
      t.string :samplingpoint
      t.integer :pollutant
      t.timestamptz :start_time
      t.timestamptz :end_time
      t.float :value
      t.string :unit
      t.integer :validity
      t.integer :verification

      t.timestamptz :ingested_at, null: false, default: -> { 'now()' }
    end

    execute 'ALTER TABLE eea_raw_measurements SET UNLOGGED'
  end

  def down
    drop_table :eea_raw_measurements
  end
end
