class AddNotNullConstraintToLocationOnMeasurements < ActiveRecord::Migration[6.1]
  def change
    change_column_null :measurements, :location, false
  end
end
