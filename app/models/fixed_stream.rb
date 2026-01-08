class FixedStream < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration
  has_many :fixed_measurements
  has_many :hourly_averages, dependent: :destroy
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
