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

    # The web map clusters at Math.round(zoom); a fractional zoom from the
    # apps lands on the same grid.
    def initialize(zoom)
      @grid = MapGrid.new(zoom.round)
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

    # Members share one cell, and no cell spans the antimeridian, so plain
    # min/max and means of the longitudes are correct.
    def cluster(items)
      latitudes = items.map(&:latitude)
      longitudes = items.map(&:longitude)

      Cluster.new(
        latitude: mean(latitudes),
        longitude: mean(longitudes),
        count: items.size,
        sources: items.map(&:source).tally,
        bounds: {
          west: longitudes.min,
          east: longitudes.max,
          south: latitudes.min,
          north: latitudes.max,
        },
        averages: averages(items),
      )
    end

    # Each item counts once per parameter, whatever its number of streams of
    # that parameter.
    def averages(items)
      item_means = Hash.new { |hash, parameter| hash[parameter] = [] }

      items.each do |item|
        item
          .streams
          .group_by(&:parameter)
          .each do |parameter, streams|
            item_means[parameter] << mean(streams.map(&:last_value))
          end
      end

      item_means
        .sort_by { |parameter, _| Parameters::KEYS.index(parameter) }
        .to_h { |parameter, means| [parameter, mean(means)] }
    end

    def mean(values)
      values.sum.to_f / values.size
    end
  end
end
