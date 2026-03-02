class StationStream < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration
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
end
