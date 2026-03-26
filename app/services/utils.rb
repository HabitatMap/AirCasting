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

  # Converts a UTC-aware +timestamp+ to a naive UTC Time whose components
  # represent the wall-clock time at +time_zone+ (IANA string, e.g.
  # 'America/New_York'). This matches the AirBeam convention where
  # fixed_measurements.time stores local time without a timezone offset, so
  # Highcharts (useUTC: true) displays the correct local time on the graph.
  #
  #   Utils.to_local_as_utc(Time.utc(2025,1,15,13,0,0), 'America/New_York')
  #   #=> 2025-01-15 08:00:00 UTC   (13:00 UTC = 08:00 EST, stored as-if-UTC)
  def self.to_local_as_utc(timestamp, time_zone)
    return nil unless timestamp

    local = timestamp.in_time_zone(time_zone)
    Time.utc(local.year, local.month, local.day, local.hour, local.min, local.sec)
  end

  # Reverse of +to_local_as_utc+: takes a naive UTC Time whose components are
  # actually local wall-clock time at +time_zone+ and returns the real UTC moment.
  # Used to convert "local-as-UTC" epoch values sent by the frontend back into
  # real UTC before querying a timestamptz column.
  #
  #   Utils.from_local_as_utc(Time.utc(2025,1,15,8,0,0), 'America/New_York')
  #   #=> 2025-01-15 13:00:00 UTC
  def self.from_local_as_utc(naive_utc, time_zone)
    tz = ActiveSupport::TimeZone[time_zone] || ActiveSupport::TimeZone['UTC']
    tz.local(naive_utc.year, naive_utc.month, naive_utc.day,
             naive_utc.hour, naive_utc.min, naive_utc.sec)
  end
end
