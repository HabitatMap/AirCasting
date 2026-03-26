module Timelapse
  class SpatialClusterer
    TILE_SIZE = 256
    MINIMUM_CLUSTER_SIZE = 2

    def self.cluster(locatables, zoom_level)
      new.cluster(locatables, zoom_level)
    end

    def cluster(locatables, zoom_level)
      grid = {}
      grid_size = calculate_grid_size(zoom_level)

      locatables.each do |item|
        point = project_point(item.latitude, item.longitude, zoom_level)
        cell_x = (point[:x] / grid_size).floor
        cell_y = (point[:y] / grid_size).floor
        cell_key = "#{cell_x}_#{cell_y}"

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

    def project_point(lat, lng, zoom)
      scale = 2**zoom
      x = (lng + 180) / 360 * TILE_SIZE * scale

      lat_rad = lat * Math::PI / 180
      y =
        (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math::PI) /
          2 * TILE_SIZE * scale

      { x: x, y: y }
    end

    def calculate_grid_size(zoom_level)
      base_size = 25
      return base_size if zoom_level <= 7

      reduction_rate = zoom_level >= 12 ? 3.0 : 1.3
      zoom_offset = zoom_level >= 12 ? 5 : 8
      exponent = [0, zoom_level - zoom_offset].max
      [base_size / (reduction_rate**exponent), 5].max
    end

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
