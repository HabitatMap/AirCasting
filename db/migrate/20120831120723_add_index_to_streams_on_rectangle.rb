class AddIndexToStreamsOnRectangle < ActiveRecord::Migration[4.2]
  def change
    add_index :streams, :min_latitude
    add_index :streams, :max_latitude
    add_index :streams, :min_longitude
    add_index :streams, :max_longitude
  end
end
