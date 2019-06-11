class AddRectangleAndAverageValueToStreams < ActiveRecord::Migration[4.2]
  def change
    add_column :streams, :min_latitude, :decimal, precision: 12, scale: 9
    add_column :streams, :max_latitude, :decimal, precision: 12, scale: 9
    add_column :streams, :min_longitude, :decimal, precision: 12, scale: 9
    add_column :streams, :max_longitude, :decimal, precision: 12, scale: 9
    add_column :streams, :average_value, :float
  end
end
