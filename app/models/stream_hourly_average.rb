class StreamHourlyAverage < ApplicationRecord
  belongs_to :stream

  validates :value, :datetime, presence: true
  validates :datetime, uniqueness: { scope: :stream_id }
end
