class AddStartAndEndTimeToSession < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :start_time, :datetime
    add_column :sessions, :end_time, :datetime

    add_index :sessions, :start_time
    add_index :sessions, :end_time
  end
end
