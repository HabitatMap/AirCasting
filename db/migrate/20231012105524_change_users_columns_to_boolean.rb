class ChangeUsersColumnsToBoolean < ActiveRecord::Migration[6.0]
  def up
    change_column_default :users, :admin, nil
    change_column_default :users, :session_stopped_alert, nil
    change_column_default :users, :send_emails, nil

    change_column :users, :admin, 'boolean USING CASE WHEN admin = 1 THEN TRUE ELSE FALSE END'
    change_column :users, :session_stopped_alert, 'boolean USING CASE WHEN session_stopped_alert = 1 THEN TRUE ELSE FALSE END'
    change_column :users, :send_emails, 'boolean USING CASE WHEN send_emails = 1 THEN TRUE ELSE FALSE END'

    change_column_default :users, :admin, false
    change_column_default :users, :session_stopped_alert, false
  end

  def down
    change_column :users, :admin, :integer, limit: 2, using: 'CASE WHEN admin THEN 1 ELSE 0 END'
    change_column :users, :session_stopped_alert, :integer, limit: 2, using: 'CASE WHEN session_stopped_alert THEN 1 ELSE 0 END'
    change_column :users, :send_emails, :integer, limit: 2, using: 'CASE WHEN send_emails THEN 1 ELSE 0 END'
  end
end
