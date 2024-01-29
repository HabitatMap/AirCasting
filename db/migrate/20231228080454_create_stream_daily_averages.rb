class CreateStreamDailyAverages < ActiveRecord::Migration[6.1]
  def change
    create_table :stream_daily_averages do |t|
      t.belongs_to :stream, null: false, foreign_key: true
      t.float :value, null: false
      t.date :date, null: false

      t.timestamps
    end
  end
end
