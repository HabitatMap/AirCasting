require 'timezone_finder'

namespace :session_timezones do
  task populate: :environment do
    puts "Starting to populate session_timezones..."

    finder = TimezoneFinder.create

    Session.find_each(batch_size: 1000) do |session|
      timezone_name = timezone_name(finder, session.latitude, session.longitude)

      ActiveRecord::Base.connection.execute(
        "INSERT INTO session_timezones (session_id, timezone_name) VALUES (#{session.id}, '#{timezone_name}')"
      )
    end

    puts "Finished populating session_timezones."
  end

  def timezone_name(finder, latitude, longitude)
    # exclude invalid lat/lon values from indoor/0,0 measurements
    return 'UTC' if latitude.nil? || longitude.nil? || [0.0].include?(latitude) || [0.0].include?(longitude) || !latitude.between?(-90, 90) || !longitude.between?(-180, 180)

    timezone_name = finder.timezone_at(lat: latitude, lng: longitude)
    return 'UTC' unless timezone_name

    timezone_name
  end
end
