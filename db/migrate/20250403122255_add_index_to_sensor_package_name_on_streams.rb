class AddIndexToSensorPackageNameOnStreams < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def change
    add_index :streams, :sensor_package_name, algorithm: :concurrently
  end
end
