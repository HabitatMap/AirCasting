class ChangeEeaRawMeasurementsTimestampsToTimestamp < ActiveRecord::Migration[
  7.0
]
  def up
    change_column :eea_raw_measurements, :start_time, :timestamp
    change_column :eea_raw_measurements, :end_time, :timestamp
  end

  def down
    change_column :eea_raw_measurements, :start_time, :timestamptz
    change_column :eea_raw_measurements, :end_time, :timestamptz
  end
end
