class AddIndexOnMeasurements < ActiveRecord::Migration[4.2]
  def change
    change_table :measurements do |t|
      t.index :latitude
      t.index :longitude
    end
  end
end
