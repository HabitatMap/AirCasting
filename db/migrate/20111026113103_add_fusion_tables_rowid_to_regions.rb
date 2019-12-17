class AddFusionTablesRowidToRegions < ActiveRecord::Migration[4.2]
  def change
    change_table :regions do |t|
      t.string :fusion_tables_rowid
    end
  end
end
