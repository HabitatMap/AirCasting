class AddIndexesToThresholdAlerts < ActiveRecord::Migration[6.1]
  def change
    add_index :threshold_alerts, [:session_uuid, :sensor_name]
  end
end
