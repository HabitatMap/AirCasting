class AddVersionToSession < ActiveRecord::Migration[5.2]
  def change
    add_column :sessions, :version, :int, default: 1
  end
end
