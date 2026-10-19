module Explore
  # GET /api/v3/explore/map: the selected sources' items in the viewport,
  # clustered on the web map's grid.
  #
  # The viewport is snapped outward to whole grid cells before querying, so a
  # cluster at the edge of the screen holds every item of its cell and does not
  # change as the user pans.
  class Map
    QUERIES = {
      AirbeamItemsQuery::SOURCE => AirbeamItemsQuery,
      GovItemsQuery::SOURCE => GovItemsQuery,
    }.freeze
    SOURCES = QUERIES.keys.freeze

    # `sources` and `measurement_types`: empty means all.
    def call(west:, east:, south:, north:, zoom:, sources: [], measurement_types: [])
      clusterer = Clusterer.new(zoom)
      bounds =
        Bounds.new(**clusterer.grid.snap(west: west, east: east, south: south, north: north))
      parameters = Parameters.select(measurement_types)

      items =
        (sources.presence || SOURCES).flat_map do |source|
          QUERIES.fetch(source).new.call(bounds: bounds, parameters: parameters)
        end
      assign_values(items) if parameters.keys.one?

      clusterer.call(items)
    end

    private

    # With one measurement type selected every stream of an item is of that
    # type; an item with several (a duplicated government stream) shows their
    # mean.
    def assign_values(items)
      items.each do |item|
        values = item.streams.map(&:last_value)
        item.value = values.sum.to_f / values.size
      end
    end
  end
end
