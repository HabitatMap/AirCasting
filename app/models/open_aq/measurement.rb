module OpenAq
  Measurement =
    Struct.new(
      :sensor_name,
      :value,
      :latitude,
      :longitude,
      :time_local,
      :time_utc,
      :location,
      :city,
      :country,
      :unit,
      keyword_init: true
    )
end
