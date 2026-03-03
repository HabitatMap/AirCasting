class EpaIngestCycle < ApplicationRecord
  enum status: {
         staging: 'staging',
         loading: 'loading',
         completed: 'completed',
         failed: 'failed',
       }

  has_many :epa_staging_batches
  has_many :epa_load_batches

  validates :window_starts_at, :window_ends_at, presence: true
end
