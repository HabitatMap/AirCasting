class AddLocationToMeasurements < ActiveRecord::Migration[6.1]
  def up
    add_column :measurements, :location, :point, geographic: true, srid: 4326
  end

  def down
    remove_column :measurements, :location
  end
end
