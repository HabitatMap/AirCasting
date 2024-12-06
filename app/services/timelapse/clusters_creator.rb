module Timelapse
  class ClustersCreator
    TILE_SIZE = 256
    MINIMUM_CLUSTER_SIZE = 2

    def initialize
      @streams_repository = StreamsRepository.new
      @cluster_processor = ClusterProcessor.new
      @sessions_repository = SessionsRepository.new
    end

    def call(params:)
      zoom_level = params[:zoom_level].to_f
      sensor_name = params[:sensor_name]

      streams = fetch_streams(params)
      clusters = cluster_streams(streams, zoom_level)

      cluster_processor.call(clusters: clusters, sensor_name: sensor_name)
    end

    private

    attr_reader :streams_repository, :cluster_processor, :sessions_repository

    def fetch_streams(params)
      sessions = filtered_sessions(params)
      streams = streams_repository.find_by_session_id(sessions.pluck(:id))
      streams.select { |stream| Sensor.sensor_name(params[:sensor_name]).include?(stream.sensor_name.downcase) }
    end

    def filtered_sessions(params)
      sessions_repository.active_in_last_7_days.filter_(params)
    end

    def cluster_streams(streams, zoom_level)
      grid = {}
      grid_size = calculate_grid_size(zoom_level)

      streams.each do |stream|
        point = project_point(stream.session.latitude, stream.session.longitude, zoom_level)
        cell_x = (point[:x] / grid_size).floor
        cell_y = (point[:y] / grid_size).floor
        cell_key = "#{cell_x}_#{cell_y}"

        grid[cell_key] ||= []
        grid[cell_key] << stream
      end

      clusters = grid.values.map do |cell_streams|
        if cell_streams.length >= MINIMUM_CLUSTER_SIZE
          create_cluster(cell_streams)
        else
          cell_streams.map { |stream| create_cluster([stream]) }
        end
      end.flatten

      clusters.sort_by { |cluster| -cluster[:session_count] }
    end

    def project_point(lat, lng, zoom)
      # Calculate scale factor based on zoom level
      # Each zoom level doubles the scale (2^zoom)
      scale = 2 ** zoom

      # Convert longitude to x coordinate
      x = (lng + 180) / 360 * TILE_SIZE * scale

      # Convert latitude to radians for trigonometric calculations
      lat_rad = lat * Math::PI / 180

      # Convert latitude to y coordinate using Web Mercator projection formula
      # This is a conformal projection that preserves angles
      y = (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math::PI) / 2 * TILE_SIZE * scale

      # Return projected x, y coordinates in pixels
      { x: x, y: y }
    end

    def calculate_grid_size(zoom_level)
      base_size = 25
      return base_size if zoom_level <= 7

      reduction_rate = zoom_level >= 12 ? 3.0 : 1.3
      zoom_offset = zoom_level >= 12 ? 5 : 8
      exponent = [0, zoom_level - zoom_offset].max
      [base_size / (reduction_rate ** exponent), 5].max
    end

    def create_cluster(streams)
      {
        latitude: streams.sum { |s| s.session.latitude } / streams.length,
        longitude: streams.sum { |s| s.session.longitude } / streams.length,
        stream_ids: streams.map(&:id),
        session_count: streams.length
      }
    end
  end
end
