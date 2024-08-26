require 'rgeo'

namespace :airnow_geometry do
  task recalculate: :environment do
    puts "Starting to recalculate AirNow geometry"

    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    User.find_by(username: 'US EPA AirNow').sessions.each do |session|
      session.measurements.each do |measurement|
        measurement.update(
          location: factory.point(measurement.longitude.to_f, measurement.latitude.to_f)
        )
      end
    end

    puts "Finished recalculating AirNow geometry"
  end
end
