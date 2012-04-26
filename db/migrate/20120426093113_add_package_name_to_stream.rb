class AddPackageNameToStream < ActiveRecord::Migration
  def change
    add_column :streams, :sensor_package_name, :text
  end
end
