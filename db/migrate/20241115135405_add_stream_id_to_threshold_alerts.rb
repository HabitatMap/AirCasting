class AddStreamIdToThresholdAlerts < ActiveRecord::Migration[6.1]
  def change
    add_reference :threshold_alerts, :stream, foreign_key: true
  end
end
