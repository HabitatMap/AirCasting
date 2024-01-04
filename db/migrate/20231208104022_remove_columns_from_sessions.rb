class RemoveColumnsFromSessions < ActiveRecord::Migration[6.1]
  def change
    remove_column :sessions, :data_type, :string
    remove_column :sessions, :instrument, :string
    remove_column :sessions, :start_time, :datetime
    remove_column :sessions, :end_time, :datetime
    remove_column :sessions, :measurements_count, :integer
  end
end
