class AddUtcTimeToMeasurement < ActiveRecord::Migration
  def change
    add_column :measurements, :arrival_utc_time, :datetime
  end
end
