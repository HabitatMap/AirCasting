class StreamDailyAverage < ApplicationRecord
  belongs_to :stream

  validates_presence_of :date, :value
end
