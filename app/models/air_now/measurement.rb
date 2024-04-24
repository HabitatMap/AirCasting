module AirNow
  Measurement =
    Struct.new(
      :sensor_name,
      :location,
      :title,
      :latitude,
      :longitude,
      :time_local,
      :time_with_time_zone,
      :value,
      keyword_init: true
    ) do
      def build_stream
        AirNow::Stream.new(
          latitude: latitude,
          longitude: longitude,
          sensor_name: sensor_name,
        )
      end
    end
end
