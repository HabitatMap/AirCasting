class EeaIngestBatch < ApplicationRecord
  enum status: {
         queued: 'queued',
         downloading: 'downloading',
         downloaded: 'downloaded',
         unzip_queued: 'unzip_queued',
         unzipping: 'unzipping',
         unzipped: 'unzipped',
         staging: 'staging',
         staged: 'staged',
         failed: 'failed',
       }

  validates :country,
            :pollutant,
            :window_starts_at,
            :window_ends_at,
            presence: true
  validates :country,
            uniqueness: {
              scope: %i[pollutant window_starts_at window_ends_at],
            }
  validates :window_ends_at, comparison: { greater_than: :window_starts_at }

  def processing?
    %w[downloading downloaded unzip_queued unzipping unzipped staging].include?(
      status,
    )
  end
end
