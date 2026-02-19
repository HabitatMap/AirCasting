class ChangeEpaRawMeasurementsValueToString < ActiveRecord::Migration[7.0]
  def up
    change_column :epa_raw_measurements, :value, :string
  end

  def down
    change_column :epa_raw_measurements, :value, :float
  end
end
