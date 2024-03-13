class AddTimezoneOffsetToSessions2 < ActiveRecord::Migration[6.1]
  def change
    add_column :sessions, :timezone_offset, :integer, null: false, default: 0
  end
end
