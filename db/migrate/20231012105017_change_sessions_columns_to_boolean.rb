class ChangeSessionsColumnsToBoolean < ActiveRecord::Migration[6.0]
  def up
    change_column :sessions, :contribute, 'boolean USING CASE WHEN contribute = 1 THEN TRUE ELSE FALSE END'
  end

  def down
    change_column :sessions, :contribute, :integer, limit: 2, using: 'CASE WHEN contribute THEN 1 ELSE 0 END'
  end
end
