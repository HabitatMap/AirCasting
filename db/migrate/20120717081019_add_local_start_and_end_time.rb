class AddLocalStartAndEndTime < ActiveRecord::Migration
  def up
    add_column :sessions, :local_start_time, :datetime
    add_column :sessions, :local_end_time, :datetime

    add_index :sessions, :local_start_time
    add_index :sessions, :local_end_time
  end

  def down
    remove_column :sessions, :local_start_time
    remove_column :sessions, :local_end_time
  end
end
