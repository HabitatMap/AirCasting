module PurpleAir
  Measurement =
    Struct.new(
      :title,
      :latitude,
      :longitude,
      :time_local,
      :time_utc,
      :value,
      keyword_init: true
    ) do
      def build_stream
        PurpleAir::Stream.new(
          latitude: latitude,
          longitude: longitude,
        )
      end
    end
end
