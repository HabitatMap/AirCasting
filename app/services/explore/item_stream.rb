module Explore
  # One selected stream of an Item, with its latest reading. `id` is
  # `streams.id` for AirBeam and `station_streams.id` for government — two
  # tables, so it is unique only within a source.
  #
  # `update_frequency`, `min_24h` and `max_24h` are filled only by the station
  # detail (GET /api/v3/explore/stations/{uuid}) and are nil on the map. The two
  # 24h bounds are nil together when the stream reported nothing in the window
  # — a dormant station is still served, it just has no recent range.
  ItemStream =
    Struct.new(
      :id,
      :sensor_name,
      :parameter,
      :unit_symbol,
      :last_value,
      :last_measured_at,
      :update_frequency,
      :min_24h,
      :max_24h,
      keyword_init: true,
    )
end
