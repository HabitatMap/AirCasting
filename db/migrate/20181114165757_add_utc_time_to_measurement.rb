class AddUtcTimeToMeasurement < ActiveRecord::Migration
  def change
    add_column :measurements, :utc_time, :datetime
  end
end
