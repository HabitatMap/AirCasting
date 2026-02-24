class HourlyAverage < ApplicationRecord
  belongs_to :station_stream, foreign_key: :station_stream_id

  validates :value, :measured_at, presence: true
  validates :measured_at, uniqueness: { scope: :station_stream_id }
end
