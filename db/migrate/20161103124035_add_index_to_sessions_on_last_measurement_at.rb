class AddIndexToSessionsOnLastMeasurementAt < ActiveRecord::Migration
  def change
    add_index :sessions, :last_measurement_at
  end
end
