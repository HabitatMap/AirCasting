class RenameLocalSessionTimes < ActiveRecord::Migration[4.2]
  def up
    rename_column :sessions, :local_start_time, :start_time_local
    rename_column :sessions, :local_end_time, :end_time_local
  end

  def down
    raise 'No Way Back'
  end
end
