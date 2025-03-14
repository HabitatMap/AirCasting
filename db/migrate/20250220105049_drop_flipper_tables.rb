class DropFlipperTables < ActiveRecord::Migration[6.1]
  def up
    drop_table :flipper_gates if table_exists?(:flipper_gates)
    drop_table :flipper_features if table_exists?(:flipper_features)
  end

  def down
    create_table :flipper_features do |t|
      t.string :key, null: false
      t.timestamps null: false
    end
    add_index :flipper_features, :key, unique: true

    create_table :flipper_gates do |t|
      t.string :feature_key, null: false
      t.string :key, null: false
      t.text :value
      t.timestamps null: false
    end
    add_index :flipper_gates,
              %i[feature_key key value],
              unique: true,
              length: {
                value: 255,
              }
  end
end
