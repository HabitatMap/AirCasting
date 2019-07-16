class FixIndexesNaming < ActiveRecord::Migration[5.2]
  def change
    rename_index :sessions,
                 'index_sessions_on_local_end_time',
                 'index_sessions_on_end_time_local'
    rename_index :sessions,
                 'index_sessions_on_local_start_time',
                 'index_sessions_on_start_time_local'
  end
end
