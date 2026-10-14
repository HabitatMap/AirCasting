class StationStream < ApplicationRecord
  ACTIVE_FOR = 24.hours

  belongs_to :source
  belongs_to :stream_configuration
  belongs_to :station, optional: true
  has_many :station_measurements
  has_many :station_stream_daily_averages

  validates :external_ref,
            :location,
            :time_zone,
            :title,
            :url_token,
            presence: true

  validates :external_ref,
            uniqueness: {
              scope: %i[source_id stream_configuration_id],
            }
  validates :url_token, uniqueness: true

  # Streams the map may list: not on an excluded station. A stream without a
  # station is shown.
  scope :shown,
        -> { left_joins(:station).where(stations: { excluded_reason: nil }) }

  # A stream that never reported is not active.
  def is_active
    last_measured_at.present? && last_measured_at > (Time.current - ACTIVE_FOR)
  end
end
