class AddTimezoneOffsetToSessions < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :timezone_offset, :Integer
  end
end
