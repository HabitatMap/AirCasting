class AddIndexOnStreamIdAndTimeToMeasurements < ActiveRecord::Migration[4.2]
  def change
    add_index :measurements, [:stream_id, :time]
  end
end
