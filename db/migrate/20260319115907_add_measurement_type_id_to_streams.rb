class AddMeasurementTypeIdToStreams < ActiveRecord::Migration[7.0]
  def change
    add_column :streams, :measurement_type_id, :integer, null: true
    add_index :streams, %i[session_id measurement_type_id],
              unique: true,
              name: 'idx_streams_session_measurement_type_id',
              where: 'measurement_type_id IS NOT NULL'
  end
end
