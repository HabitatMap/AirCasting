class EpaIngestBatch < ApplicationRecord
  enum status: {
    queued: 'queued',
    downloaded: 'downloaded',
    parsed: 'parsed',
    matched: 'matched',
    saved: 'saved',
    completed: 'completed',
    failed: 'failed',
  }

  validates :window_starts_at, :window_ends_at, presence: true
  validates :window_starts_at,
            uniqueness: {
              scope: :window_ends_at,
            }
  validates :window_ends_at, comparison: { greater_than: :window_starts_at }

  def processing?
    %w[downloaded parsed matched saved].include?(status)
  end
end
