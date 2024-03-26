require 'timezone_finder'

namespace :sessions_time_zones do
  task populate: :environment do
    puts "Starting to populate sessions time zones"

    finder = TimezoneFinder.create

    Session.find_each(batch_size: 1000) do |session|
      time_zone = TimeZoneBuilder.new.call(session.latitude, session.longitude)
      session.update(time_zone: time_zone)
    end

    puts "Finished populating sessions time zones"
  end
end
