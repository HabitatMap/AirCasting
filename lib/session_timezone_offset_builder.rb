class SessionTimezoneOffsetBuilder
  def initialize(latitude:, longitude:)
    @latitude = latitude
    @longitude = longitude
  end

  def call
    session_timezone = timezone_name(latitude, longitude)
    Time.zone_offset(session_timezone)
  end

  private

  attr_reader :latitude, :longitude

  def timezone_name(latitude, longitude)
    finder = TimezoneFinder.create
    # exclude invalid lat/lon values from indoor/0,0 sessions
    return 'UTC' if latitude.nil? || longitude.nil? || [0.0].include?(latitude) || [0.0].include?(longitude) || !latitude.between?(-90, 90) || !longitude.between?(-180, 180)

    timezone_name = finder.timezone_at(lat: latitude, lng: longitude)
    return 'UTC' unless timezone_name

    timezone_name
  end
end
