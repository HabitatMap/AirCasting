class CreateMeasurements < ActiveRecord::Migration[4.2]
  def change
    create_table :measurements do |t|
      t.float :value
      t.float :latitude
      t.float :longitude
      t.datetime :time
      t.references :session
    end
  end
end
