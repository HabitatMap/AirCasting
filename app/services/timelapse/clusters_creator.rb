module Timelapse
  class ClustersCreator
    TILE_SIZE = 256

    def initialize
      @measurements_repository = MeasurementsRepository.new
      @streams_repository = StreamsRepository.new
      @cluster_processor = ClusterProcessor.new
      @sessions_repository = SessionsRepository.new
    end

    def call(params:)
      Rails.logger.info "Starting clustering process with params: #{params.inspect}"

      sessions = filtered_sessions(params)
      zoom_level = params[:zoom_level] || 1
      sensor_name = params[:sensor_name]

      Rails.logger.info "Found #{sessions.count} sessions, zoom_level: #{zoom_level}"

      streams = streams_repository.find_by_session_id(sessions.pluck(:id))
      selected_sensor_streams =
        streams.select do |stream|
          Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase
        end

      Rails.logger.info "Selected #{selected_sensor_streams.count} streams for sensor: #{sensor_name}"

      streams_with_coordinates = streams_with_coordinates(selected_sensor_streams)
      clusters = cluster_measurements(streams_with_coordinates, zoom_level)
      clusters = calculate_centroids_for_clusters(clusters)

      Rails.logger.info "Final cluster count: #{clusters.count}"

      cluster_processor.call(clusters: clusters, sensor_name: sensor_name)
    end

    private

    attr_reader :measurements_repository,
                :streams_repository,
                :cluster_processor,
                :sessions_repository

    def filtered_sessions(params)
      sessions_active_in_last_7_days = sessions_repository.active_in_last_7_days
      sessions_active_in_last_7_days.filter_(params)
    end

    def streams_with_coordinates(streams)
      streams.map do |stream|
        {
          stream_id: stream.id,
          latitude: stream.session.latitude,
          longitude: stream.session.longitude,
        }
      end
    end

    def cluster_measurements(streams_with_coordinates, zoom_level)
      grid_cell_size = determine_grid_cell_size(zoom_level)
      pixels_per_degree = (TILE_SIZE * (2 ** zoom_level)) / 360.0

      Rails.logger.info "Clustering parameters:"
      Rails.logger.info "  Zoom level: #{zoom_level}"
      Rails.logger.info "  Grid cell size: #{grid_cell_size}"
      Rails.logger.info "  Total streams to cluster: #{streams_with_coordinates.size}"
      Rails.logger.info "  Pixels per degree: #{pixels_per_degree}"

      # Group by grid cells instead of distance-based clustering
      grid = {}

      streams_with_coordinates.each do |stream|
        cell_x = (stream[:longitude].to_f * pixels_per_degree).floor / grid_cell_size.floor
        cell_y = (stream[:latitude].to_f * pixels_per_degree).floor / grid_cell_size.floor
        cell_key = "#{cell_x}_#{cell_y}"

        grid[cell_key] ||= []
        grid[cell_key] << stream
      end

      # Convert grid cells to clusters
      clusters = grid.values.map do |cell_streams|
        cell_streams.map { |s| s.slice(:stream_id, :latitude, :longitude) }
      end

      Rails.logger.info "Created #{clusters.size} clusters"
      Rails.logger.info "Cluster sizes: #{clusters.map(&:size)}"

      clusters
    end

    def determine_grid_cell_size(zoom_level)
      zoom_level = zoom_level.to_i
      base_size = 25  # Match frontend's baseCellSize

      # Match frontend's logic
      if zoom_level >= 12
        reduction_rate = 3.0  # Math.pow(3, ...)
        zoom_offset = 5      # zoomLevel - 5
      else
        reduction_rate = 1.3  # Math.pow(1.3, ...)
        zoom_offset = 8      # zoomLevel - 8
      end

      exponent = [0, zoom_level - zoom_offset].max
      cell_size = base_size / (reduction_rate ** exponent)
      final_size = [cell_size, 10].max  # Match frontend's minimumCellSize

      Rails.logger.info "Determining grid cell size:"
      Rails.logger.info "  Base size (pixels): #{base_size}"
      Rails.logger.info "  Reduction rate: #{reduction_rate}"
      Rails.logger.info "  Zoom offset: #{zoom_offset}"
      Rails.logger.info "  Final size (pixels): #{final_size}"

      final_size
    end

    def calculate_centroids_for_clusters(clusters)
      Rails.logger.info "Calculating centroids for #{clusters.size} clusters"

      clusters.map do |streams|
        latitudes = streams.map { |stream| stream[:latitude] }
        longitudes = streams.map { |stream| stream[:longitude] }

        next if latitudes.empty? || longitudes.empty?

        centroid_latitude = latitudes.sum / latitudes.size
        centroid_longitude = longitudes.sum / longitudes.size

        Rails.logger.debug "Cluster centroid:"
        Rails.logger.debug "  Streams: #{streams.size}"
        Rails.logger.debug "  Centroid position: #{centroid_latitude}, #{centroid_longitude}"

        {
          latitude: centroid_latitude,
          longitude: centroid_longitude,
          stream_ids: streams.map { |stream| stream[:stream_id] },
          session_count: streams.size,
        }
      end.compact
    end
  end
end
