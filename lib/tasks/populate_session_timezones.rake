require 'timezone_finder'

namespace :sessions_timezone do
  task populate: :environment do
    puts "Starting to populate sessions timezones"

    finder = TimezoneFinder.create

    Session.find_each(batch_size: 1000) do |session|
      timezone = timezone_name(finder, session.latitude, session.longitude)
      session.update(timezone: timezone)
    end

    puts "Finished populating sessions timezones"
  end

  def timezone_name(finder, latitude, longitude)
    # exclude invalid lat/lon values from indoor/0,0 measurements
    return 'UTC' if latitude.nil? || longitude.nil? || [0.0].include?(latitude) || [0.0].include?(longitude) || !latitude.between?(-90, 90) || !longitude.between?(-180, 180)

    timezone_name = finder.timezone_at(lat: latitude, lng: longitude)
    return 'UTC' unless timezone_name

    timezone_name
  end
end
