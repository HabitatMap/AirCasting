class Station < ApplicationRecord
  EXCLUDED_REASONS = {
    temporary: 'temporary',
    no_coordinates: 'no_coordinates',
  }.freeze

  belongs_to :source
  has_many :station_streams

  validates :external_ref, :title, :location, :time_zone, presence: true
  validates :external_ref, uniqueness: { scope: :source_id }
  validates :excluded_reason,
            inclusion: { in: EXCLUDED_REASONS.values },
            allow_nil: true

  scope :shown, -> { where(excluded_reason: nil) }

  # A station is active if anything coming off it is.
  def is_active
    station_streams.any?(&:is_active)
  end
end
