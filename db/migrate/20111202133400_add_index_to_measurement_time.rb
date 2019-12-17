class AddIndexToMeasurementTime < ActiveRecord::Migration[4.2]
  def change
    add_index :measurements, :time
  end
end
