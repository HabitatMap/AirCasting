class AddLastCheckAtToThresholdAlerts < ActiveRecord::Migration[6.1]
  def change
    add_column :threshold_alerts, :last_check_at, :datetime
  end
end
