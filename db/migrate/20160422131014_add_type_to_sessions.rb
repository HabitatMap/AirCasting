class AddTypeToSessions < ActiveRecord::Migration
  def change
    add_column :sessions, :type, :string, null: false
  end
end
