class CreateStationStreamDailyAverages < ActiveRecord::Migration[7.0]
  def change
    create_table :station_stream_daily_averages do |t|
      t.references :station_stream, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :value, null: false
      t.timestamps
    end

    add_index :station_stream_daily_averages,
              %i[station_stream_id date],
              unique: true,
              name: 'index_station_stream_daily_avg_on_stream_id_and_date'
  end
end
