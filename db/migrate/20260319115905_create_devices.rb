class CreateDevices < ActiveRecord::Migration[7.0]
  def change
    create_table :devices do |t|
      t.string :mac_address, null: false
      t.string :model, null: false
      t.string :name
      t.timestamps
    end
    add_index :devices, :mac_address, unique: true
  end
end
