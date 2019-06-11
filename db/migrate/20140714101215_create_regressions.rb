class CreateRegressions < ActiveRecord::Migration[4.2]
  def change
    create_table :regressions do |t|
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
      t.string :sensor_package_name
      t.string :measurement_type
      t.string :unit_name
      t.string :unit_symbol
      %w[very_low low medium high very_high].each do |level|
        t.integer "threshold_#{level}"
      end
      t.text :coefficients
    end
  end
end
