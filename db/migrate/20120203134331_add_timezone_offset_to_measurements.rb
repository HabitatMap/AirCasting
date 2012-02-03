class AddTimezoneOffsetToMeasurements < ActiveRecord::Migration
  def change
    add_column :measurements, :timezone_offset, :Integer
  end
end
