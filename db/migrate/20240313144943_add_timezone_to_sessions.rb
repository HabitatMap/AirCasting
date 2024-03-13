class AddTimezoneToSessions < ActiveRecord::Migration[6.1]
  def change
    add_column :sessions, :timezone_offset, :string, null: false, default: 'UTC'
  end
end
