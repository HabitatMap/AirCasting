class RemoveIndexOnStreamIdAndTimeFromFixedMeasurements < ActiveRecord::Migration[
  7.0
]
  def up
    remove_index :fixed_measurements, column: %i[stream_id time]
  end

  def down
    add_index :fixed_measurements, %i[stream_id time], unique: true
  end
end
