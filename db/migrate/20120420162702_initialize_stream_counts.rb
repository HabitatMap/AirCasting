class InitializeStreamCounts < ActiveRecord::Migration
  def up
    execute <<-SQL
      UPDATE streams
      SET measurements_count = (
        SELECT COUNT(*) FROM measurements
        WHERE stream_id = streams.id
      )
    SQL
  end

  def down
  end
end
