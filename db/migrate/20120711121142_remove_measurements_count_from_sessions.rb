class RemoveMeasurementsCountFromSessions < ActiveRecord::Migration
  def up
    remove_column :sessions, :measurements_count
  end

  def down
    add_column :sessions, :measurements_count, :Integer
  end
end
