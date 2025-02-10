class CreateFixedMeasurements < ActiveRecord::Migration[6.1]
  def change
    create_table :fixed_measurements do |t|
      t.references :stream, null: false, foreign_key: true
      t.float :value, null: false
      t.datetime :time, null: false

      t.timestamps
    end

    execute <<-SQL
      ALTER TABLE fixed_measurements
      ADD COLUMN time_with_time_zone TIMESTAMPTZ NOT NULL;
    SQL

    add_index :fixed_measurements, %i[stream_id time], unique: true
    add_index :fixed_measurements,
              %i[stream_id time_with_time_zone],
              unique: true
  end
end
