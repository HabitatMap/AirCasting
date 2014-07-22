class AddMeasurementShortTypeToRegressions < ActiveRecord::Migration
  def change
    add_column :regressions, :measurement_short_type, :string
  end
end
