class AddNotNullConstraintsToThresholdAlerts < ActiveRecord::Migration[6.1]
  def change
    change_column_null :threshold_alerts, :stream_id, false
    change_column_null :threshold_alerts, :user_id, false
  end
end
