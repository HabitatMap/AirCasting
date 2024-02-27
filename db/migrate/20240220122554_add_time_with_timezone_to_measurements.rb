class AddTimeWithTimezoneToMeasurements < ActiveRecord::Migration[6.1]
  def up
    execute <<-SQL
      ALTER TABLE measurements
      ADD COLUMN time_with_timezone TIMESTAMPTZ;
    SQL
  end

  def down
    remove_column :measurements, :time_with_timezone
  end
end
