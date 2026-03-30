class AddDeviceIdToSessions < ActiveRecord::Migration[7.0]
  def change
    add_reference :sessions, :device, null: true, foreign_key: true
  end
end
