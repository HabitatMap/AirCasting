class ChangeCoordinatesToDecimal < ActiveRecord::Migration[4.2]
  def up
    change_table :measurements do |t|
      t.change :latitude, :decimal, precision: 12, scale: 9
      t.change :longitude, :decimal, precision: 12, scale: 9
    end

    change_table :regions do |t|
      t.change :north, :decimal, precision: 12, scale: 9
      t.change :south, :decimal, precision: 12, scale: 9
      t.change :east, :decimal, precision: 12, scale: 9
      t.change :west, :decimal, precision: 12, scale: 9
    end
  end

  def down
    change_table :measurements do |t|
      t.change :latitude, :float
      t.change :longitude, :float
    end

    change_table :regions do |t|
      t.change :north, :float
      t.change :south, :float
      t.change :east, :float
      t.change :west, :float
    end
  end
end
