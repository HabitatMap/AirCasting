class CreateHourlyAverages < ActiveRecord::Migration[7.0]
  def change
    create_table :hourly_averages do |t|
      t.references :fixed_stream, null: false, index: false, foreign_key: true
      t.integer :value, null: false
      t.datetime :measured_at, null: false

      t.timestamps
    end

    execute <<~SQL
      CREATE UNIQUE INDEX index_hourly_averages_on_fixed_stream_and_measured_at
      ON hourly_averages (fixed_stream_id, measured_at)
      INCLUDE (value);
    SQL

    add_index :hourly_averages, :measured_at
  end
end
