class RemoveMeasurementsReceivedCountFromSessions < ActiveRecord::Migration[5.2]
  def change
    if column_exists?(:sessions, :measurements_received_count)
      remove_column :sessions, :measurements_received_count
    end
  end
end
