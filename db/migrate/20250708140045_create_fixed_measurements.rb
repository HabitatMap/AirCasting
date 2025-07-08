class CreateFixedMeasurements < ActiveRecord::Migration[6.1]
  def change
    create_table :fixed_measurements do |t|
      t.references :stream, null: false, foreign_key: true
      t.float :value, null: false
      t.datetime :time, null: false
      t.timestamptz :time_with_time_zone, null: false

      t.timestamps
    end

    add_index :fixed_measurements, %i[stream_id time], unique: true
    add_index :fixed_measurements,
              %i[stream_id time_with_time_zone],
              unique: true
  end
end
