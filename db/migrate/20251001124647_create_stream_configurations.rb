class CreateStreamConfigurations < ActiveRecord::Migration[7.0]
  def change
    create_table :stream_configurations do |t|
      t.string :measurement_type, null: false
      t.string :unit_symbol, null: false

      t.integer :threshold_very_low, null: false
      t.integer :threshold_low, null: false
      t.integer :threshold_medium, null: false
      t.integer :threshold_high, null: false
      t.integer :threshold_very_high, null: false

      t.timestamps
    end

    add_index :stream_configurations,
              %i[measurement_type unit_symbol],
              unique: true
  end
end
