class ChangeFixedMeasurements < ActiveRecord::Migration[7.0]
  def change
    add_column :fixed_measurements, :fixed_stream_id, :bigint
    add_column :fixed_measurements, :measured_at, :timestamptz, precision: 6
  end
end
