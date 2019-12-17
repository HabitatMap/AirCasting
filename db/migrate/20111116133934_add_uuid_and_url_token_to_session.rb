class AddUuidAndUrlTokenToSession < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :uuid, :string, size: 36
    add_index :sessions, :uuid

    add_column :sessions, :url_token, :string
    add_index :sessions, :url_token
  end
end
