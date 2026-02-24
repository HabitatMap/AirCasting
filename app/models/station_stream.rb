class StationStream < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration
  has_many :fixed_measurements, foreign_key: :station_stream_id
  has_many :hourly_averages, foreign_key: :station_stream_id, dependent: :delete_all
  belongs_to :stream, optional: true # TEMP

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
end
