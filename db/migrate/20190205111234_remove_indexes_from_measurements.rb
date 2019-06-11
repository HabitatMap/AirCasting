class RemoveIndexesFromMeasurements < ActiveRecord::Migration[4.2]
  def up
    if index_exists?(:measurements, :latitude)
      remove_index :measurements, :latitude
    end
    if index_exists?(:measurements, :longitude)
      remove_index :measurements, :longitude
    end
    remove_index :measurements, :time if index_exists?(:measurements, :time)
    if index_exists?(:measurements, %i[longitude latitude])
      remove_index :measurements, %i[longitude latitude]
    end
    if index_exists?(:measurements, :stream_id)
      remove_index :measurements, :stream_id
    end
  end

  def down
    add_index :measurements, :latitude
    add_index :measurements, :longitude
    add_index :measurements, :time
    add_index :measurements, %i[longitude latitude]
    add_index :measurements, :stream_id
  end
end
