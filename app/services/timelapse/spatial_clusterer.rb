module Timelapse
  class SpatialClusterer
    MINIMUM_CLUSTER_SIZE = 2

    def self.cluster(locatables, zoom_level)
      new.cluster(locatables, zoom_level)
    end

    def cluster(locatables, zoom_level)
      grid = {}
      map_grid = MapGrid.new(zoom_level)

      locatables.each do |item|
        cell_key = map_grid.cell(item.latitude, item.longitude)

        grid[cell_key] ||= []
        grid[cell_key] << item
      end

      clusters =
        grid
          .values
          .map do |cell_items|
            if cell_items.length >= MINIMUM_CLUSTER_SIZE
              create_cluster(cell_items)
            else
              cell_items.map { |item| create_cluster([item]) }
            end
          end
          .flatten

      clusters.sort_by { |c| -c[:count] }
    end

    private

    def create_cluster(items)
      {
        latitude: items.sum(&:latitude) / items.length,
        longitude: items.sum(&:longitude) / items.length,
        ids: items.map(&:id),
        count: items.length,
      }
    end
  end
end
