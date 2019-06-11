class AddMillisToMeasurements < ActiveRecord::Migration[4.2]
  def up
    add_column :measurements, :milliseconds, :Integer, default: 0
  end

  def down
    remove_column :measurements, :milliseconds
  end
end
