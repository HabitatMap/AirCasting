class StreamConfiguration < ApplicationRecord
  has_many :fixed_streams, dependent: :restrict_with_error

  validates :measurement_type,
            :unit_symbol,
            :threshold_very_low,
            :threshold_low,
            :threshold_medium,
            :threshold_high,
            :threshold_very_high,
            presence: true
  validates :unit_symbol, uniqueness: { scope: :measurement_type }
end
