require 'rgeo'

namespace :airnow_geometry do
  task recalculate: :environment do
    puts "Starting to recalculate AirNow geometry"

    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    user = User.find_by(username: 'US EPA AirNow')
    sessions = user.sessions.includes(:measurements)
    total_sessions = sessions.size
    processed_sessions = 0

    sessions.find_each(batch_size: 100) do |session|
      # Calculate the location once per session
      location = factory.point(session.longitude.to_f, session.latitude.to_f)

      # Update all measurements in the session in a single query
      session.measurements.update_all(location: location)

      processed_sessions += 1
      puts "Processed #{processed_sessions}/#{total_sessions} sessions" if (processed_sessions % 10).zero?
    end

    puts "Finished recalculating AirNow geometry"
  end
end
