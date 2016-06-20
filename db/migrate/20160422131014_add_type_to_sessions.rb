class AddTypeToSessions < ActiveRecord::Migration
  def up
    add_column :sessions, :type, :string, null: false
    Session.where(type: '').update_all(type: 'MobileSession')
  end

  def down
    remove_column :sessions, :type
  end
end
