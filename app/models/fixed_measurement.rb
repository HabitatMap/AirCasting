class FixedMeasurement < ApplicationRecord
  belongs_to :stream

  validates :value, :time, :time_with_time_zone, presence: true
  validates :time, uniqueness: { scope: :stream_id }
  validates :time_with_time_zone, uniqueness: { scope: :stream_id }
end
