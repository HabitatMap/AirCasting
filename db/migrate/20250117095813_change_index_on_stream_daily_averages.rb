class ChangeIndexOnStreamDailyAverages < ActiveRecord::Migration[6.1]
  def change
    remove_index :stream_daily_averages, :stream_id
    add_index :stream_daily_averages, %i[stream_id date], unique: true
  end
end
