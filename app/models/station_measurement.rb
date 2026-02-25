class StationMeasurement < ApplicationRecord
  belongs_to :station_stream

  validates :measured_at, :value, presence: true
  validates :measured_at, uniqueness: { scope: :station_stream_id }
end
