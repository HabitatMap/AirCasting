class CreateEpaStagingBatches < ActiveRecord::Migration[7.0]
  def change
    create_table :epa_staging_batches do |t|
      t.references :epa_ingest_cycle, null: false, foreign_key: true
      t.timestamptz :measured_at, null: false
      t.string :status, null: false, default: 'queued'

      t.timestamps
    end

    add_index :epa_staging_batches, :status
  end
end
