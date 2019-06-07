class AddTimezoneOffsetToMeasurements < ActiveRecord::Migration[4.2]
  def change
    add_column :measurements, :timezone_offset, :Integer
  end
end
