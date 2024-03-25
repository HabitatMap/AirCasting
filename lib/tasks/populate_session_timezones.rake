require 'timezone_finder'

namespace :sessions_timezone do
  task populate: :environment do
    puts "Starting to populate sessions timezones"

    finder = TimezoneFinder.create

    Session.find_each(batch_size: 1000) do |session|
      timezone = SessionTimezoneBuilder.new.call(session.latitude, session.longitude)
      session.update(timezone: timezone)
    end

    puts "Finished populating sessions timezones"
  end
end
