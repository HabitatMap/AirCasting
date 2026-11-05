module Explore
  # One selected stream of a StationItem, in the shape the API renders it:
  # how to name it, what unit it is in, and what it last read. `id` is
  # `streams.id` for AirBeam and `station_streams.id` for government — two
  # tables, so it is unique only within a source.
  #
  # The `Rich` is against Explore::StreamItem, which is the same stream carrying
  # only what reading its measurements needs. Neither is a strict superset of
  # the other: this one has no `source`, because whoever built it already knew
  # which one it came from.
  #
  # `update_frequency`, `min_24h` and `max_24h` are filled only by the station
  # detail (GET /api/v3/explore/stations/{uuid}) and are nil on the map. The two
  # 24h bounds are nil together when the stream reported nothing in the window
  # — a dormant station is still served, it just has no recent range.
  StreamItemRich =
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
