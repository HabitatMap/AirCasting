class CreateEeaIngestBatches < ActiveRecord::Migration[7.0]
  def change
    create_table :eea_ingest_batches do |t|
      t.string :country, null: false
      t.string :pollutant, null: false
      t.timestamptz :window_starts_at, null: false
      t.timestamptz :window_ends_at, null: false
      t.string :status, null: false, default: 'queued'

      t.timestamps
    end

    add_index :eea_ingest_batches,
              %i[country pollutant window_starts_at window_ends_at],
              unique: true,
              name: 'idx_eea_ingest_batches_window_unique'

    add_index :eea_ingest_batches, :status

    add_check_constraint :eea_ingest_batches,
                         'window_starts_at < window_ends_at',
                         name: 'chk_eea_ingest_batches_window_bounds'
  end
end
