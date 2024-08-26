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
      stream_ids = selected_sensor_streams.pluck(:id)

      grid_cell_size = determine_grid_cell_size(zoom_level)

      grid = Hash.new { |hash, key| hash[key] = [] }

      sql = ActiveRecord::Base.sanitize_sql_array([
        <<-SQL, stream_ids
          WITH last_measurements AS (
            SELECT DISTINCT ON (m.stream_id)
              m.stream_id,
              m.latitude,
              m.longitude
            FROM measurements m
            WHERE m.stream_id IN (?)
            ORDER BY m.stream_id, m.time DESC
          )
          SELECT stream_id, latitude, longitude FROM last_measurements
        SQL
      ])

      result = ActiveRecord::Base.connection.exec_query(sql)

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
