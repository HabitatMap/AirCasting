class AddMeasuredValueToMeasurements < ActiveRecord::Migration[4.2]
  def change
    add_column :measurements, :measured_value, :float
  end
end
