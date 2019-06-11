class CreateDeletedSessions < ActiveRecord::Migration[4.2]
  def change
    create_table :deleted_sessions do |t|
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
      t.string :uuid, size: 36
      t.integer :user_id
    end

    add_index :deleted_sessions, %i[uuid user_id]
    add_index :deleted_sessions, :user_id
  end
end
