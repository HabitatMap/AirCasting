class ChangeTypeForValueInStreamDailyAverages < ActiveRecord::Migration[6.1]
  def change
    change_column :stream_daily_averages, :value, :integer
  end
end
