class Utils
  MINUTES_IN_DAY = 60 * 24
  FIRST_MINUTE_OF_DAY = 0
  LAST_MINUTE_OF_DAY = MINUTES_IN_DAY - 1

  def self.whole_day?(time_from, time_to)
    time_from == FIRST_MINUTE_OF_DAY && time_to == LAST_MINUTE_OF_DAY
  end

  def self.minutes_of_day(time)
    time.hour * 60 + time.min
  end
end
