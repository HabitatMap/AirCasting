class AddIndexOnStreamIdAndTimeToMeasurements < ActiveRecord::Migration
  def change
    add_index :measurements, [:stream_id, :time]
  end
end
