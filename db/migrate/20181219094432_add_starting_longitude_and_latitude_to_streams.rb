class AddStartingLongitudeAndLatitudeToStreams < ActiveRecord::Migration[4.2]
  def up
    unless column_exists?(:streams, :start_longitude)
      add_column :streams, :start_longitude, :decimal, precision: 12, scale: 9
    end

    unless column_exists?(:streams, :start_latitude)
      add_column :streams, :start_latitude, :decimal, precision: 12, scale: 9
    end
  end

  def down
    remove_column :streams, :start_longitude
    remove_column :streams, :start_latitude
  end
end
