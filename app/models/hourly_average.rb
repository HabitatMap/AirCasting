class HourlyAverage < ApplicationRecord
  belongs_to :fixed_stream

  validates :value, :measured_at, presence: true
  validates :measured_at, uniqueness: { scope: :fixed_stream_id }
end
