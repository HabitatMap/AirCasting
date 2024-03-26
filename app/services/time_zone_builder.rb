class TimeZoneBuilder
  def initialize
    @finder = TimezoneFinder.create
  end

  def call(latitude, longitude)
    time_zone_name(latitude, longitude)
  end

  private

  attr_reader :finder

  def time_zone_name(latitude, longitude)
    # exclude invalid lat/lon values from indoor/0,0 sessions
    return 'UTC' if latitude.nil? || longitude.nil?
    return 'UTC' if [0.0].include?(latitude) && [0.0].include?(longitude)
    return 'UTC' if !latitude.between?(-90, 90) || !longitude.between?(-180, 180)

    time_zone_name = finder.timezone_at(lat: latitude, lng: longitude)
    return 'UTC' unless time_zone_name

    time_zone_name
  end
end
