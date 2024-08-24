module Timelapse
  class ClustersCreator
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call(sessions:, begining_of_first_time_slice:, end_of_last_time_slice:, sensor_name:)

      streams = Stream.where(session_id: sessions.pluck('sessions.id'))
      selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase }

      # clusters = cluster_measurements(selected_sensor_streams, determine_clustering_distance(data[:zoom_level]))

      time_now = Time.current
      clusters = cluster_measurements(selected_sensor_streams, 100000)
      Rails.logger.info("Clusters creation took #{Time.current - time_now} seconds")

      time_now = Time.current
      clusters = calculate_centroids_for_clusters(clusters)
      Rails.logger.info("Centroids calculation took #{Time.current - time_now} seconds")

      time_now = Time.current
      clusters = process_clusters(clusters, begining_of_first_time_slice, end_of_last_time_slice)
      Rails.logger.info("Clusters processing took #{Time.current - time_now} seconds")
    end

    def cluster_measurements(selected_sensor_streams, distance)
      stream_ids = selected_sensor_streams.pluck(:id)

      sql = ActiveRecord::Base.sanitize_sql_array([
        <<-SQL, stream_ids, distance
          WITH random_measurements AS (
            SELECT DISTINCT ON (m.stream_id)
              m.stream_id,
              ST_Transform(m.location, 3857) as projected_location,
              m.latitude,
              m.longitude
            FROM measurements m
            WHERE m.stream_id IN (?)
            ORDER BY m.stream_id, RANDOM()
          )
          SELECT
            rm.stream_id,
            rm.projected_location,
            rm.latitude,
            rm.longitude,
            ST_ClusterDBSCAN(rm.projected_location, eps := ?, minpoints := 1) OVER () as cluster_id
          FROM
            random_measurements rm
        SQL
      ])

      result = ActiveRecord::Base.connection.exec_query(sql)

      clusters = result.rows.group_by { |row| row[4] } # row[4] is the cluster_id
      clusters.transform_values { |rows| rows.map { |row| [row[0], row[1], row[2], row[3]] } } # Keep stream_id, location, latitude, and longitude
    end

    def calculate_centroids_for_clusters(clusters)
      clusters.map do |cluster_id, measurements|
        latitudes = measurements.map { |_, _, latitude, _| latitude.to_f }
        longitudes = measurements.map { |_, _, _, longitude| longitude.to_f }

        next if latitudes.empty? || longitudes.empty?

        centroid_latitude = latitudes.sum / latitudes.size
        centroid_longitude = longitudes.sum / longitudes.size

        {
          cluster_id: cluster_id,
          latitude: centroid_latitude,
          longitude: centroid_longitude,
          stream_ids: measurements.map { |measurement| measurement[0] },
          session_count: measurements.size
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
