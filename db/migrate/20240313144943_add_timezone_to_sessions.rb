class AddTimezoneToSessions < ActiveRecord::Migration[6.1]
  def change
    add_column :sessions, :timezone, :string, null: false, default: 'UTC'
  end
end
