class SimplifyEpaIngestBatches < ActiveRecord::Migration[7.0]
  def up
    remove_check_constraint :epa_ingest_batches,
                            name: 'chk_epa_ingest_batches_window_bounds'

    rename_column :epa_ingest_batches, :window_starts_at, :measured_at

    remove_column :epa_ingest_batches, :window_ends_at, :timestamptz
  end

  def down
    add_column :epa_ingest_batches, :window_ends_at, :timestamptz, null: false

    rename_column :epa_ingest_batches, :measured_at, :window_starts_at

    add_check_constraint :epa_ingest_batches,
                         'window_starts_at < window_ends_at',
                         name: 'chk_epa_ingest_batches_window_bounds'
  end
end
