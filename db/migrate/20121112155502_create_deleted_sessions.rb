class CreateDeletedSessions < ActiveRecord::Migration
  def change
    create_table :deleted_sessions do |t|
      t.timestamps
      t.string :uuid, :size => 36
      t.integer :user_id
    end

    add_index :deleted_sessions, [:uuid, :user_id]
    add_index :deleted_sessions, :user_id
  end
end
