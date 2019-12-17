class AddOffsetToSession < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :offset_60_db, :integer
  end
end
