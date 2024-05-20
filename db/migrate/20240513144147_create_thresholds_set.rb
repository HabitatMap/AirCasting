class CreateThresholdsSet < ActiveRecord::Migration[6.1]
  def change
    create_table :threshold_sets do |t|
      t.string :sensor_name
      t.string :unit_symbol
      t.boolean :is_default
      t.float :threshold_very_low
      t.float :threshold_low
      t.float :threshold_medium
      t.float :threshold_high
      t.float :threshold_very_high
      t.timestamps
    end

    add_index :threshold_sets, [:sensor_name, :unit_symbol]
  end
end
