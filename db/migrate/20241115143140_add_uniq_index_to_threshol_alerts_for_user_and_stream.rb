class AddUniqIndexToThresholAlertsForUserAndStream < ActiveRecord::Migration[
  6.1
]
  def change
    add_index :threshold_alerts, %i[user_id stream_id], unique: true
  end
end
