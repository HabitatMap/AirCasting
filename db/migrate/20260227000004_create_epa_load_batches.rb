class CreateEpaLoadBatches < ActiveRecord::Migration[7.0]
  def change
    create_table :epa_load_batches do |t|
      t.references :epa_ingest_cycle, null: false, foreign_key: true
      t.string :measurement_type, null: false
      t.string :status, null: false, default: 'queued'

      t.timestamps
    end

    add_index :epa_load_batches,
              %i[epa_ingest_cycle_id measurement_type],
              unique: true,
              name: 'idx_epa_load_batches_unique_type_per_cycle'
  end
end
