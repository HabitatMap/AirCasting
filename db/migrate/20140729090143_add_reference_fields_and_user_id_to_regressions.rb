class AddReferenceFieldsAndUserIdToRegressions < ActiveRecord::Migration
  def change
    add_column :regressions, :reference_sensor_package_name, :string
    add_column :regressions, :reference_sensor_name, :string
    add_column :regressions, :user_id, :integer
  end
end
