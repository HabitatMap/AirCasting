class RemoveUniqueIndexFromEeaIngestBatches < ActiveRecord::Migration[7.0]
  def change
    remove_index :eea_ingest_batches, name: 'idx_eea_ingest_batches_window_unique'
  end
end
