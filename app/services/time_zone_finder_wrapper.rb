class TimeZoneFinderWrapper
  include Singleton

  def initialize
    @time_zone_finder = TimezoneFinder.create
  end

  def timezone_at(lat:, lng:)
    @time_zone_finder.timezone_at(lat: lat, lng: lng)
  end
end
