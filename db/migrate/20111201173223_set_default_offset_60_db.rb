class SetDefaultOffset60Db < ActiveRecord::Migration[4.2]
  def up
    connection.execute('UPDATE sessions SET offset_60_db = 0')
  end

  def down; end
end
