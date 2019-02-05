class RemoveIndexesFromMeasurements < ActiveRecord::Migration
  def up
    remove_index :measurements, :latitude
    remove_index :measurements, :longitude
    remove_index :measurements, :time
    remove_index :measurements, [ :longitude, :latitude ]
    remove_index :measurements, :stream_id
  end

  def down
    add_index :measurements, :latitude
    add_index :measurements, :longitude
    add_index :measurements, :time
    add_index :measurements, [ :longitude, :latitude ]
    add_index :measurements, :stream_id
  end
end
