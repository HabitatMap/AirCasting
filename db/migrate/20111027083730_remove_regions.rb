class RemoveRegions < ActiveRecord::Migration[4.2]
  def up
    drop_table :regions
  end

  def down
    create_table :regions do |t|
      t.timestamps

      t.string :fusion_tables_rowid
      t.decimal :north, precision: 12, scale: 9
      t.decimal :south, precision: 12, scale: 9
      t.decimal :east, precision: 12, scale: 9
      t.decimal :west, precision: 12, scale: 9
      t.boolean :synchronized, default: true
    end
  end
end
