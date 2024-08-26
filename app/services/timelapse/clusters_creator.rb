module Timelapse
  class ClustersCreator
    def initialize
      @measurements_repository = MeasurementsRepository.new
      @streams_repository = StreamsRepository.new
    end

    def call(sessions:, begining_of_first_time_slice:, end_of_last_time_slice:, sensor_name:, zoom_level:)
      streams = streams_repository.find_by_session_id(sessions.pluck(:id))
      selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase }

      clusters = cluster_measurements(selected_sensor_streams, zoom_level)

      clusters = calculate_centroids_for_clusters(clusters)

      clusters = process_clusters(clusters, begining_of_first_time_slice, end_of_last_time_slice)

      clusters
    end

    private

    attr_reader :measurements_repository, :streams_repository

    def cluster_measurements(selected_sensor_streams, zoom_level)
      stream_ids = selected_sensor_streams.pluck(:id)

      grid_cell_size = determine_grid_cell_size(zoom_level)

      grid = Hash.new { |hash, key| hash[key] = [] }

      result = measurements_repository.streams_coordinates(stream_ids)

      result.rows.each do |row|
        stream_id, latitude, longitude = row

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

    def process_clusters(clusters, begining_of_first_time_slice, end_of_last_time_slice)
      result = {}

      clusters.each do |cluster|
        averages =
          measurements_repository.streams_averages_from_period(
            stream_ids: cluster[:stream_ids],
            start_date: begining_of_first_time_slice,
            end_date: end_of_last_time_slice
          )

        averages.each do |average|
          result[average[:time]] ||= []
          result[average[:time]] <<
            {
              "value" => average[:value],
              "latitude" => cluster[:latitude],
              "longitude" => cluster[:longitude],
              "sessions" => cluster[:session_count]
            }
        end
      end

      result
    end
  end
end
