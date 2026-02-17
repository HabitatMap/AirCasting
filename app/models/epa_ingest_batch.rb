class EpaIngestBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         extracted: 'extracted',
         transformed: 'transformed',
         saved: 'saved',
         completed: 'completed',
         failed: 'failed',
       }

  validates :measured_at, presence: true
end
