class AddTimezoneToSessions < ActiveRecord::Migration[6.1]
  def change
    add_column :sessions, :time_zone, :string, null: false, default: 'UTC'
  end
end
