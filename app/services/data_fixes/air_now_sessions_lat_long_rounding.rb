module DataFixes
  class AirNowSessionsLatLongRounding
    def call
      AirNowStreaming::Repository.new.air_now_sessions.find_each do |session|
        latitude = session.latitude.round(3)
        longitude = session.longitude.round(3)

        session.update(latitude: latitude, longitude: longitude)

        session.streams.each do |stream|
          stream.update(
            min_latitude: latitude,
            min_longitude: longitude,
            max_latitude: latitude,
            max_longitude: longitude,
            start_latitude: latitude,
            start_longitude: longitude,
          )
        end
      end
    end
  end
end
