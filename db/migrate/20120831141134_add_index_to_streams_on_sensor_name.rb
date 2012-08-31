class AddIndexToStreamsOnSensorName < ActiveRecord::Migration
  def change
    add_index :streams, :sensor_name
  end
end
