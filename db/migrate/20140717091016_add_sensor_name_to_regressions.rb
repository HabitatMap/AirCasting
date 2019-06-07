class AddSensorNameToRegressions < ActiveRecord::Migration[4.2]
  def change
    add_column :regressions, :sensor_name, :string
  end
end
