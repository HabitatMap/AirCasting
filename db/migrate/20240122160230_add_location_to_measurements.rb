class AddLocationToMeasurements < ActiveRecord::Migration[6.1]
  def up
    add_column :measurements, :location, :geometry, srid: 4326
  end

  def down
    remove_column :measurements, :location
  end
end
