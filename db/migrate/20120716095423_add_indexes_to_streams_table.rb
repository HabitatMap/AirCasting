class AddIndexesToStreamsTable < ActiveRecord::Migration[4.2]
  def change
    add_index :streams, :session_id
    add_index :streams, %i[sensor_name measurement_type]
  end
end
