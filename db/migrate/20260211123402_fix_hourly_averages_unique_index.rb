class FixHourlyAveragesUniqueIndex < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    remove_index :hourly_averages, name: :index_hourly_averages_on_fixed_stream_and_measured_at
    add_index :hourly_averages, [:fixed_stream_id, :measured_at], unique: true, algorithm: :concurrently
  end

  def down
    remove_index :hourly_averages, [:fixed_stream_id, :measured_at], algorithm: :concurrently
    execute <<~SQL
      CREATE UNIQUE INDEX CONCURRENTLY index_hourly_averages_on_fixed_stream_and_measured_at
      ON hourly_averages (fixed_stream_id, measured_at) INCLUDE (value)
    SQL
  end
end
