require 'timezone_finder'

namespace :sessions_timezone do
  task populate: :environment do
    puts "Starting to populate sessions timezones"

    finder = TimezoneFinder.create

    Session.find_each(batch_size: 1000) do |session|
      time_zone = TimeZoneBuilder.new.call(session.latitude, session.longitude)
      session.update(time_zone: time_zone)
    end

    puts "Finished populating sessions timezones"
  end
end
