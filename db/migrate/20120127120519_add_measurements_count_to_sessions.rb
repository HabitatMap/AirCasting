class AddMeasurementsCountToSessions < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :measurements_count, :Integer
  end
end
