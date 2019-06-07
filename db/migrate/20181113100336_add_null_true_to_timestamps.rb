class AddNullTrueToTimestamps < ActiveRecord::Migration[4.2]
  def change
    change_column :notes, :created_at, :datetime, null: true
    change_column :notes, :updated_at, :datetime, null: true

    change_column :sessions, :created_at, :datetime, null: true
    change_column :sessions, :updated_at, :datetime, null: true

    change_column :users, :created_at, :datetime, null: true
    change_column :users, :updated_at, :datetime, null: true
  end
end
