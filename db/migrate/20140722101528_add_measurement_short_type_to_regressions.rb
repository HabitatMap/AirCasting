class AddMeasurementShortTypeToRegressions < ActiveRecord::Migration[4.2]
  def change
    add_column :regressions, :measurement_short_type, :string
  end
end
