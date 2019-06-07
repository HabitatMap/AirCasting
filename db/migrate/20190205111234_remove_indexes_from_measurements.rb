class RemoveIndexesFromMeasurements < ActiveRecord::Migration[4.2]
  def up
    remove_index :measurements, :latitude if index_exists?(:measurements, :latitude)
    remove_index :measurements, :longitude if index_exists?(:measurements, :longitude)
    remove_index :measurements, :time if index_exists?(:measurements, :time)
    remove_index :measurements, [ :longitude, :latitude ] if index_exists?(:measurements, [ :longitude, :latitude ])
    remove_index :measurements, :stream_id if index_exists?(:measurements, :stream_id)
  end

  def down
    add_index :measurements, :latitude
    add_index :measurements, :longitude
    add_index :measurements, :time
    add_index :measurements, [ :longitude, :latitude ]
    add_index :measurements, :stream_id
  end
end
