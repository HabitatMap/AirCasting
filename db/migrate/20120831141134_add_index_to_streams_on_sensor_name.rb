class AddIndexToStreamsOnSensorName < ActiveRecord::Migration[4.2]
  def change
    add_index :streams, :sensor_name
  end
end
