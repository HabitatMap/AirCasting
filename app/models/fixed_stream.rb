class FixedStream < ApplicationRecord
  belongs_to :source
  belongs_to :stream_configuration
  has_many :fixed_measurements, dependent: :nullify

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
