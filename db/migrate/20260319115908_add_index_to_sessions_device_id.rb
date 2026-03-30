class AddIndexToSessionsDeviceId < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :sessions, :device_id, algorithm: :concurrently
  end
end
