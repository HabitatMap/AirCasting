class FixedMeasurement < ApplicationRecord
  belongs_to :stream
  belongs_to :fixed_stream, optional: true

  validates :value, :time, :time_with_time_zone, presence: true
  validates :time_with_time_zone, uniqueness: { scope: :stream_id }
end
