class FixedStreamMeasurement < ApplicationRecord
  belongs_to :fixed_stream

  validates :measured_at, presence: true
  validates :value, presence: true, numericality: true
  validates :measured_at, uniqueness: { scope: :fixed_stream_id }
end
