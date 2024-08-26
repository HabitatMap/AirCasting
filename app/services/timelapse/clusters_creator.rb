module Timelapse
  class ClustersCreator
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call(sessions:, begining_of_first_time_slice:, end_of_last_time_slice:, sensor_name:, zoom_level:)
      streams = Stream.where(session_id: sessions.pluck('sessions.id'))
      selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase }

      time_now = Time.current
      clusters = cluster_measurements(selected_sensor_streams, zoom_level)
      Rails.logger.info("Clusters creation took #{Time.current - time_now} seconds")

      time_now = Time.current
      clusters = calculate_centroids_for_clusters(clusters)
      Rails.logger.info("Centroids calculation took #{Time.current - time_now} seconds")

      time_now = Time.current
      clusters = process_clusters(clusters, begining_of_first_time_slice, end_of_last_time_slice)
      Rails.logger.info("Clusters processing took #{Time.current - time_now} seconds")

      clusters
    end

    def cluster_measurements(selected_sensor_streams, zoom_level)
      # Define grid cell size based on zoom level (adjust the base size as needed)
      grid_cell_size = determine_grid_cell_size(zoom_level)

      # Calculate clusters using grid-based approach
      grid = Hash.new { |hash, key| hash[key] = [] }

      # Query only one latitude and longitude per stream
      sql = ActiveRecord::Base.sanitize_sql_array([
        <<-SQL, selected_sensor_streams.pluck(:id)
          SELECT
            s.id AS stream_id,
            s.latitude,
            s.longitude
          FROM streams s
          WHERE s.id IN (?)
        SQL
      ])

      result = ActiveRecord::Base.connection.exec_query(sql)

      # Group streams into grid cells based on lat/lon
      result.rows.each do |row|
        stream_id, latitude, longitude = row

        # Determine the grid cell this stream belongs to
        cell_x = (longitude.to_f / grid_cell_size).floor
        cell_y = (latitude.to_f / grid_cell_size).floor

        # Assign the stream to the appropriate grid cell
        grid[[cell_x, cell_y]] << { stream_id: stream_id, latitude: latitude.to_f, longitude: longitude.to_f }
      end

      # Group the grid cells into clusters
      clusters = grid.values

      clusters
    end

    def determine_grid_cell_size(zoom_level)
      # Adjust the base cell size (in degrees or meters) based on your needs
      base_cell_size = 0.1 # degrees for lower zoom levels, adjust as needed
      cell_size = base_cell_size / (2**zoom_level)
      cell_size
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
          MeasurementsRepository.new.streams_averages_from_period(
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
