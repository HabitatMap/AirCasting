class SetDefaultToStreamsOnSensorPackageName < ActiveRecord::Migration[4.2]
  def up
    change_column :streams,
                  :sensor_package_name,
                  :string,
                  null: false,
                  default: 'Builtin'
  end

  def down
    change_column :streams,
                  :sensor_package_name,
                  :text,
                  null: true,
                  default: nil
  end
end
