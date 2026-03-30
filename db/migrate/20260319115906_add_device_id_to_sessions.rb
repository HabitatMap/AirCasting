class AddDeviceIdToSessions < ActiveRecord::Migration[7.0]
  def change
    add_column :sessions, :device_id, :bigint
    add_foreign_key :sessions, :devices
  end
end
