class FixedMeasurement < ApplicationRecord
  belongs_to :stream
  belongs_to :station_stream, optional: true, foreign_key: :station_stream_id

  validates :value, :time, :time_with_time_zone, presence: true
  validates :time_with_time_zone, uniqueness: { scope: :stream_id }
end
