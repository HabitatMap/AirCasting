class AddLastMeasurementAtToSessions < ActiveRecord::Migration
  def change
    add_column :sessions, :last_measurement_at, :datetime
  end
end
