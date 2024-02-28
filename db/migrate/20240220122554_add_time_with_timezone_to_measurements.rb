class AddTimeWithTimezoneToMeasurements < ActiveRecord::Migration[6.1]
  def up
    execute <<-SQL
      ALTER TABLE measurements
      ADD COLUMN time_with_time_zone TIMESTAMPTZ;
    SQL
  end

  def down
    remove_column :measurements, :time_with_time_zone
  end
end
