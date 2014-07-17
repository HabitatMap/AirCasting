class AddSensorNameToRegressions < ActiveRecord::Migration
  def change
    add_column :regressions, :sensor_name, :string
  end
end
