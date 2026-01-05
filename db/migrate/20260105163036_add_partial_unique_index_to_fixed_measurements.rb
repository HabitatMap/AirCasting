class AddPartialUniqueIndexToFixedMeasurements < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :fixed_measurements,
              %i[fixed_stream_id measured_at],
              unique: true,
              algorithm: :concurrently,
              where: 'fixed_stream_id IS NOT NULL AND measured_at IS NOT NULL',
              name: 'idx_uniq_fixed_stream_measured_at_partial'
  end
end
