class TimeZoneFinderWrapper
  include Singleton

  def initialize
    @time_zone_finder = TimezoneFinder.create
  end

  def time_zone_at(lat:, lng:)
    if lat.nil? || lng.nil? || lat.zero? || lng.zero? || lat > 90 ||
         lat < -90 || lng > 180 || lng < -180
      return 'UTC'
    end

    @time_zone_finder.timezone_at(lat: lat, lng: lng)
  end
end
