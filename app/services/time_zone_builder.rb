class TimeZoneBuilder
  def initialize(finder: TimezoneFinder.create)
    @finder = finder
  end

  def call(latitude, longitude)
    time_zone_at(latitude, longitude)
  end

  private

  attr_reader :finder

  def time_zone_at(lat, lng)
    if lat.nil? || lng.nil? || lat.zero? || lng.zero? || lat > 90 ||
         lat < -90 || lng > 180 || lng < -180
      return 'UTC'
    end

    finder.timezone_at(lng: lng, lat: lat)
  end
end
