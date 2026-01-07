class AddFixedMeasurementsFixedStreamsFk < ActiveRecord::Migration[7.0]
  def change
    add_foreign_key :fixed_measurements, :fixed_streams, validate: false
  end
end
