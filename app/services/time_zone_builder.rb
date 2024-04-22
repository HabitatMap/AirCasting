class TimeZoneBuilder
  def initialize
    @finder = TimezoneFinder.create
  end

  def call(latitude, longitude)
    time_zone_name(latitude, longitude)
  end

  private

  attr_reader :finder

  def time_zone_at(lat, lng)
    if lat.nil? || lng.nil? || lat.zero? || lng.zero? || lat > 90 || lat < -90 || lng > 180 || lng < -180
      return 'UTC'
    end

    time_zone_finder.create.timezone_at(lng: lng, lat: lat)
  end
end
