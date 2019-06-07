class AddLastMeasurementAtToSessions < ActiveRecord::Migration[4.2]
  def change
    add_column :sessions, :last_measurement_at, :datetime
  end
end
