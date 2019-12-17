class CreateRegions < ActiveRecord::Migration[4.2]
  def change
    create_table :regions do |t|
      t.timestamps

      t.float :north
      t.float :south
      t.float :east
      t.float :west
      t.boolean :synchronized, default: true
    end
  end
end
