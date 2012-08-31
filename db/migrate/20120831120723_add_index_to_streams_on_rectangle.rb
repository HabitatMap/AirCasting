class AddIndexToStreamsOnRectangle < ActiveRecord::Migration
  def change
    add_index :streams, :min_latitude
    add_index :streams, :max_latitude
    add_index :streams, :min_longitude
    add_index :streams, :max_longitude
  end
end
