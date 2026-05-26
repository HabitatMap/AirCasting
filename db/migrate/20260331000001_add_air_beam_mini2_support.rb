class AddAirBeamMini2Support < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    create_table :devices do |t|
      t.string :mac_address, null: false
      t.string :model, null: false
      t.string :name
      t.timestamps
    end
    add_index :devices, :mac_address, unique: true

    add_column :sessions, :device_id, :bigint
    add_foreign_key :sessions, :devices
    add_index :sessions, :device_id, algorithm: :concurrently

    add_column :streams, :sensor_type_id, :integer, null: true
    add_index :streams, %i[session_id sensor_type_id],
              unique: true,
              name: 'idx_streams_session_sensor_type_id',
              where: 'sensor_type_id IS NOT NULL',
              algorithm: :concurrently
  end
end
