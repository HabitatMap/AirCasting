class ChangeFixedStreams < ActiveRecord::Migration[7.0]
  def change
    add_column :fixed_streams, :title, :string, null: false
    add_column :fixed_streams, :url_token, :string, null: false
  end
end
