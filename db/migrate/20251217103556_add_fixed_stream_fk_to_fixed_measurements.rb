class AddFixedStreamFkToFixedMeasurements < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    add_index :fixed_measurements, :fixed_stream_id, algorithm: :concurrently
    add_foreign_key :fixed_measurements, :fixed_streams
  end

  def down
    remove_foreign_key :fixed_measurements, :fixed_streams
    remove_index :fixed_measurements,
                 column: :fixed_stream_id,
                 algorithm: :concurrently
  end
end
