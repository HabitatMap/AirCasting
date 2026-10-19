module Explore
  # One selected stream of an Item, with its latest reading.
  ItemStream =
    Struct.new(
      :sensor_name,
      :parameter,
      :unit_symbol,
      :last_value,
      :last_measured_at,
      keyword_init: true,
    )
end
