class CreateThresholdAlerts < ActiveRecord::Migration[6.1]
  def change
    create_table :threshold_alerts do |t|
      t.integer :user_id
      t.string :session_uuid
      t.string :sensor_name
      t.float :threshold_value
      t.integer :frequency
      t.datetime :last_email_at

      t.timestamps
    end
  end
end
