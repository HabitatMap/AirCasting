# Force time obj in timezone convert to UTC, without changing local time.
# 2012-07-17 17:57:51 +0400 has to be 2012-07-17 17:57:51 +0000
# It's redundant, and I'm aware of it, but it has help with filtering data in DB
class TimeToLocalInUTC
  def self.convert(time)
    Time.parse time.strftime('%FT%T')
  end
end
