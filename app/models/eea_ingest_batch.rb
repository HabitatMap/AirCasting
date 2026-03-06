class EeaIngestBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         downloaded: 'downloaded',
         unzipped: 'unzipped',
         copied: 'copied',
         transformed: 'transformed',
         saved: 'saved',
         averaged: 'averaged',
         completed: 'completed',
         failed: 'failed',
       }

  validates :country,
            :pollutant,
            :window_starts_at,
            :window_ends_at,
            presence: true
  validates :window_ends_at, comparison: { greater_than: :window_starts_at }
end
