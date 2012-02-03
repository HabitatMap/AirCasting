class AddTimezoneOffsetToSessions < ActiveRecord::Migration
  def change
    add_column :sessions, :timezone_offset, :Integer
  end
end
