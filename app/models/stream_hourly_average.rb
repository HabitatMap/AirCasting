class StreamHourlyAverage < ApplicationRecord
  belongs_to :stream

  validates :value, :date_time, presence: true
  validates :date_time, uniqueness: { scope: :stream_id }
end
