module Timelapse
  class ClustersCreator
    def initialize
      @measurements_repository = MeasurementsRepository.new
      @streams_repository = StreamsRepository.new
      @cluster_processor = ClusterProcessor.new
      @sessions_repository = SessionsRepository.new
    end

    def call(params:)
      sessions = filtered_sessions(params)
      zoom_level = params[:zoom_level] || 1
      sensor_name = params[:sensor_name]
      streams = streams_repository.find_by_session_id(sessions.pluck(:id))
      selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase }
      streams_with_coordinates = streams_with_coordinates(selected_sensor_streams)

      clusters = cluster_measurements(streams_with_coordinates, zoom_level)
      clusters = calculate_centroids_for_clusters(clusters)
      cluster_processor.call(clusters: clusters)
    end

    private

    attr_reader :measurements_repository, :streams_repository, :cluster_processor, :sessions_repository

    def filtered_sessions(params)
      sessions_active_in_last_7_days = sessions_repository.active_in_last_7_days
      sessions_active_in_last_7_days.filter_(params)
    end

    def streams_with_coordinates(streams)
      streams.map do |stream|
        {
          stream_id: stream.id,
          latitude: stream.session.latitude,
          longitude: stream.session.longitude
        }
      end
    end

    def cluster_measurements(streams_with_coordinates, zoom_level)
      grid_cell_size = determine_grid_cell_size(zoom_level)

      grid = Hash.new { |hash, key| hash[key] = [] }

      streams_with_coordinates.each do |stream_with_coordinates|
        stream_id, latitude, longitude =
          stream_with_coordinates.values_at(
            :stream_id,
            :latitude,
            :longitude
          )

        cell_x = (longitude.to_f / grid_cell_size).floor
        cell_y = (latitude.to_f / grid_cell_size).floor

        grid[[cell_x, cell_y]] << { stream_id: stream_id, latitude: latitude.to_f, longitude: longitude.to_f }
      end

      clusters = grid.values

      clusters
    end

    def determine_grid_cell_size(zoom_level)
      base_cell_size = 15
      cell_size = base_cell_size / (1.7**zoom_level)
      minimum_cell_size = 0.0001
      [cell_size, minimum_cell_size].max
    end

    def calculate_centroids_for_clusters(clusters)
      clusters.map do |streams|
        latitudes = streams.map { |stream| stream[:latitude] }
        longitudes = streams.map { |stream| stream[:longitude] }

        next if latitudes.empty? || longitudes.empty?

        centroid_latitude = latitudes.sum / latitudes.size
        centroid_longitude = longitudes.sum / longitudes.size

        {
          latitude: centroid_latitude,
          longitude: centroid_longitude,
          stream_ids: streams.map { |stream| stream[:stream_id] },
          session_count: streams.size
        }
      end.compact
    end
  end
end
