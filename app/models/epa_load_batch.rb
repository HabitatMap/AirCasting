class EpaLoadBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         completed: 'completed',
         failed: 'failed',
       }

  belongs_to :epa_ingest_cycle

  validates :measurement_type, presence: true
end
