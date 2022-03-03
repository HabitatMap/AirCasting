module PurpleAir
  class UtcToLocal
    def initialize
      @timezone_finder = TimezoneFinder.create
    end

    def call(time_utc, latitude, longitude)
      time_utc
        .in_time_zone(timezone(latitude, longitude))
        .to_datetime
        .change(offset: 0) # In AirCasting we do not use timezones. All times are considered UTC.
    end

    private

    def timezone(latitude, longitude)
      @timezone_finder.timezone_at(lng: longitude, lat: latitude)
    rescue StandardError => e
      raise InvalidField.new("latitude #{latitude}, longitude: #{longitude}")
    end
  end
end
