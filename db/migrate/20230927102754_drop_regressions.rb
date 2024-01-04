class DropRegressions < ActiveRecord::Migration[6.1]
  def change
    drop_table :regressions do |t|
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
      t.string :sensor_package_name
      t.string :measurement_type
      t.string :unit_name
      t.string :unit_symbol
      t.integer :threshold_very_low
      t.integer :threshold_low
      t.integer :threshold_medium
      t.integer :threshold_high
      t.integer :threshold_very_high
      t.text :coefficients
      t.string :sensor_name
      t.string :measurement_short_type
      t.string :reference_sensor_package_name
      t.string :reference_sensor_name
      t.integer :user_id
    end
  end
end
