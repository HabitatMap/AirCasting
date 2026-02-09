class CreateEpaIngestBatches < ActiveRecord::Migration[7.0]
  def change
    create_table :epa_ingest_batches do |t|
      t.timestamptz :window_starts_at, null: false
      t.timestamptz :window_ends_at, null: false
      t.string :status, null: false, default: 'queued'

      t.timestamps
    end

    add_index :epa_ingest_batches,
              %i[window_starts_at window_ends_at],
              unique: true,
              name: 'idx_epa_ingest_batches_unique'

    add_index :epa_ingest_batches, :status

    add_check_constraint :epa_ingest_batches,
                         'window_starts_at < window_ends_at',
                         name: 'chk_epa_ingest_batches_window_bounds'
  end
end
