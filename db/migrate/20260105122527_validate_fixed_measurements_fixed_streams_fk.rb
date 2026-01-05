class ValidateFixedMeasurementsFixedStreamsFk < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    validate_foreign_key :fixed_measurements, :fixed_streams
  end
end
