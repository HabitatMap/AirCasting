class CreateStreamHourlyAverages < ActiveRecord::Migration[6.1]
  def change
    create_table :stream_hourly_averages do |t|
      t.references :stream, null: false, index: false, foreign_key: true
      t.integer :value, null: false
      t.datetime :datetime, null: false

      t.timestamps
    end

    add_index :stream_hourly_averages, %i[stream_id datetime], unique: true
  end
end
