class AddMeasuredValueToMeasurements < ActiveRecord::Migration
  def change
    add_column :measurements, :measured_value, :float
  end
end
