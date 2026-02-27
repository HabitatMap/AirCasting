class StationStreamDailyAverage < ApplicationRecord
  belongs_to :station_stream

  validates_presence_of :date, :value
end
