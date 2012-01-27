class AddMeasurementsCountToSessions < ActiveRecord::Migration
  def change
    add_column :sessions, :measurements_count, :Integer
  end
end
