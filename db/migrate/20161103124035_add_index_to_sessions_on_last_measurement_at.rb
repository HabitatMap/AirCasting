class AddIndexToSessionsOnLastMeasurementAt < ActiveRecord::Migration[4.2]
  def change
    add_index :sessions, :last_measurement_at
  end
end
