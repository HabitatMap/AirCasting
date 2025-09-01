desc 'Round latitude and longitude of AirNow sessions'
task round_lat_long_of_air_now_sessions: :environment do
  DataFixes::AirNowSessionsLatLongRounding.new.call
end
