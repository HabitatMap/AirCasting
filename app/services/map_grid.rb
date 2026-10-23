# Web Mercator pixel grid behind the map clusters: timelapse
# (Timelapse::SpatialClusterer), the explore map (Explore::Clusterer), and the
# web map's own client-side copy in gridClusterAlgorithm.tsx — keep the cell
# size in step with it. Cells are fixed in world pixels at a zoom, so which
# cell a point falls in never depends on the viewport.
class MapGrid
  TILE_SIZE = 256
  BASE_CELL_SIZE = 25
  # Where Web Mercator turns the world into a square; the map shows nothing
  # beyond it.
  MAX_LATITUDE = 85.05112878

  attr_reader :zoom

  def initialize(zoom)
    @zoom = zoom
  end

  # In pixels: 25 up to zoom 7, then shrinking to a floor of 5.
  def cell_size
    @cell_size ||=
      if zoom <= 7
        BASE_CELL_SIZE
      else
        reduction_rate = zoom >= 12 ? 3.0 : 1.3
        zoom_offset = zoom >= 12 ? 5 : 8
        exponent = [0, zoom - zoom_offset].max
        [BASE_CELL_SIZE / (reduction_rate**exponent), 5].max
      end
  end

  def cell(latitude, longitude)
    x, y = project(latitude, longitude)

    [(x / cell_size).floor, (y / cell_size).floor]
  end

  # Grows a viewport outward to whole cells, so a cluster at its edge holds
  # every point of its cell, not just the ones that happened to be in view.
  # West and east snap independently, which keeps a viewport across the
  # antimeridian (west > east) crossing it.
  def snap(west:, east:, south:, north:)
    west_x, north_y = project(clamp_latitude(north), west)
    east_x, south_y = project(clamp_latitude(south), east)

    snapped = {
      west: longitude_at(floor_to_cell(west_x)),
      east: longitude_at(ceil_to_cell(east_x)),
      south: latitude_at(ceil_to_cell(south_y)),
      north: latitude_at(floor_to_cell(north_y))
    }

    # A viewport across the antimeridian that grows past its own other edge
    # covers every longitude.
    snapped.merge!(west: -180.0, east: 180.0) if west > east && snapped[:west] <= snapped[:east]

    snapped
  end

  private

  def world_size
    @world_size ||= TILE_SIZE * 2**zoom
  end

  def project(latitude, longitude)
    x = (longitude + 180) / 360.0 * world_size

    lat_rad = latitude * Math::PI / 180
    y =
      (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math::PI) / 2 * world_size

    [x, y]
  end

  def longitude_at(x)
    (x.to_f / world_size * 360 - 180).clamp(-180.0, 180.0)
  end

  def latitude_at(y)
    lat_rad = Math.atan(Math.sinh(Math::PI * (1 - 2 * y.to_f / world_size)))

    clamp_latitude(lat_rad * 180 / Math::PI)
  end

  def clamp_latitude(latitude)
    latitude.to_f.clamp(-MAX_LATITUDE, MAX_LATITUDE)
  end

  def floor_to_cell(pixels)
    (pixels / cell_size).floor * cell_size
  end

  def ceil_to_cell(pixels)
    (pixels / cell_size).ceil * cell_size
  end
end
