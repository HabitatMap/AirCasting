class ChangeFixedMeasurements < ActiveRecord::Migration[7.0]
  def change
    add_column :fixed_measurements, :fixed_stream_id, :bigint, foreign_key: true
    add_column :fixed_measurements, :measured_at, :timestamptz, precision: 6

    add_index :fixed_measurements, %i[fixed_stream_id measured_at], unique: true
  end
end
