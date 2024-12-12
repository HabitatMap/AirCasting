class CreateStreamHourlyAverages < ActiveRecord::Migration[6.1]
  def change
    create_table :stream_hourly_averages do |t|
      t.references :stream, null: false, index: false, foreign_key: true
      t.integer :value, null: false
      t.datetime :date_time, null: false

      t.timestamps
    end

    add_index :stream_hourly_averages, %i[stream_id date_time], unique: true
  end
end
