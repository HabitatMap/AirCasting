class EpaStagingBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         extracted: 'extracted',
         completed: 'completed',
         failed: 'failed',
       }

  belongs_to :epa_ingest_cycle

  validates :measured_at, presence: true
end
