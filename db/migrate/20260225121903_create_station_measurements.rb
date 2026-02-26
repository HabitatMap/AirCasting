class CreateStationMeasurements < ActiveRecord::Migration[7.0]
  def change
    create_table :station_measurements do |t|
      t.references :station_stream, null: false, foreign_key: true
      t.timestamptz :measured_at, null: false
      t.float :value, null: false

      t.timestamps
    end

    add_index :station_measurements,
              %i[station_stream_id measured_at],
              unique: true

    add_index :station_measurements, :measured_at
  end
end
