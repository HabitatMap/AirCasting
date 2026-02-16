class EpaIngestBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         extracted: 'extracted',
         transformed: 'transformed',
         saved: 'saved',
         completed: 'completed',
         failed: 'failed',
       }

  validates :window_starts_at, :window_ends_at, presence: true
  validates :window_ends_at, comparison: { greater_than: :window_starts_at }

  def processing?
    %w[extracted transformed saved].include?(status)
  end
end
