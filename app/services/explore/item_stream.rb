module Explore
  # One selected stream of an Item, with its latest reading. `id` is
  # `streams.id` for AirBeam and `station_streams.id` for government — two
  # tables, so it is unique only within a source.
  ItemStream =
    Struct.new(
      :id,
      :sensor_name,
      :parameter,
      :unit_symbol,
      :last_value,
      :last_measured_at,
      keyword_init: true,
    )
end
