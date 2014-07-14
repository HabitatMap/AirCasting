class CreateRegressions < ActiveRecord::Migration
  def change
    create_table :regressions do |t|
      t.timestamps
      t.string :sensor_package_name
      t.string :measurement_type
      t.string :unit_name
      t.string :unit_symbol
      ['very_low', 'low', 'medium', 'high', 'very_high'].each do |level|
        t.integer "threshold_#{level}"
      end
      t.text :coefficients
    end
  end
end
