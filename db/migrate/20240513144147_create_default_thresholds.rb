class CreateDefaultThresholds < ActiveRecord::Migration[6.1]
  def change
    create_table :default_thresholds do |t|
      t.string :sensor_name
      t.string :unit_symbol
      t.float :threshold_very_low
      t.float :threshold_low
      t.float :threshold_medium
      t.float :threshold_high
      t.float :threshold_very_high
      t.timestamps
    end

    add_index :default_thresholds, [:sensor_name, :unit_symbol]
  end
end
