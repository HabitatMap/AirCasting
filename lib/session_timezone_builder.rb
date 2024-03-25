class SessionTimezoneBuilder
  def initialize
    @timezone_finder = TimezoneFinder.create
  end

  def call(latitude, longitude)
    timezone_name(latitude, longitude)
  end

  private

  attr_reader :latitude, :longitude

  def timezone_name(latitude, longitude)
    finder = TimezoneFinder.create
    # exclude invalid lat/lon values from indoor/0,0 sessions
    return 'UTC' if latitude.nil? || longitude.nil?
    return 'UTC' if [0.0].include?(latitude) && [0.0].include?(longitude)
    return 'UTC' if !latitude.between?(-90, 90) || !longitude.between?(-180, 180)

    timezone_name = finder.timezone_at(lat: latitude, lng: longitude)
    return 'UTC' unless timezone_name

    timezone_name
  end
end
