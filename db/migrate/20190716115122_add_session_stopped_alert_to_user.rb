class AddSessionStoppedAlertToUser < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :session_stopped_alert, :bool, default: false
  end
end
