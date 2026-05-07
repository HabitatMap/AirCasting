class AddSessionTokenToSessions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :sessions, :session_token, :string
    add_index :sessions, :session_token, unique: true, algorithm: :concurrently
  end
end
