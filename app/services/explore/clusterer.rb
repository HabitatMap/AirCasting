module Explore
  # Groups items into the web map's grid cells (MapGrid). A cell with two or
  # more items becomes one Cluster; a lone item stays an Item. Everything is
  # computed from the items already loaded — no query per cluster.
  class Clusterer
    MINIMUM_CLUSTER_SIZE = 2
    # Items at (almost) the same point — an AirBeam on the roof of an EPA
    # site — share a cell at every zoom. From here on nothing is clustered, so
    # they can always be told apart. Tune on device.
    NO_CLUSTER_ZOOM = 16

    attr_reader :grid

    # A whole-number zoom: the web map clusters at Math.round of its zoom, and
    # the API takes the client's rounded zoom the same way.
    def initialize(zoom)
      @grid = MapGrid.new(zoom)
    end

    def call(items)
      return items if grid.zoom >= NO_CLUSTER_ZOOM

      items
        .group_by { |item| grid.cell(item.latitude, item.longitude) }
        .values
        .flat_map do |cell_items|
          if cell_items.size >= MINIMUM_CLUSTER_SIZE
            [cluster(cell_items)]
          else
            cell_items
          end
        end
    end

    private

    # Members share one cell, and no cell spans the antimeridian, so a plain
    # mean of the longitudes is correct.
    def cluster(items)
      values = items.map(&:value)

      Cluster.new(
        latitude: mean(items.map(&:latitude)),
        longitude: mean(items.map(&:longitude)),
        count: items.size,
        value: values.all? ? mean(values) : nil,
      )
    end

    def mean(values)
      values.sum.to_f / values.size
    end
  end
end
