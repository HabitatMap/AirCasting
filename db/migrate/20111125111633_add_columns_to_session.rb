class AddColumnsToSession < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :title, :text
    add_column :sessions, :description, :text
    add_column :sessions, :tags, :text
    add_column :sessions, :calibration, :integer
  end
end
