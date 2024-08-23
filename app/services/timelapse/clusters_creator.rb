module Timelapse
  class ClustersCreator
    def initialize
      @measurements_repository = MeasurementsRepository.new
    end

    def call(sessions:, begining_of_first_time_slice:, end_of_last_time_slice:, sensor_name:)

      streams = Stream.where(session_id: sessions.pluck('sessions.id'))
      selected_sensor_streams = streams.select { |stream| Sensor.sensor_name(sensor_name).include? stream.sensor_name.downcase }

      # clusters = cluster_measurements(selected_sensor_streams, determine_clustering_distance(data[:zoom_level]))
      clusters = cluster_measurements(selected_sensor_streams, 100000)

      clusters = calculate_centroids_for_clusters(clusters)

      clusters = process_clusters(clusters, begining_of_first_time_slice, end_of_last_time_slice)
    end

    def cluster_measurements(selected_sensor_streams, distance)
      stream_ids = selected_sensor_streams.pluck(:id)

      sql = ActiveRecord::Base.sanitize_sql_array([
        <<-SQL, stream_ids, distance
          WITH random_measurements AS (
            SELECT DISTINCT ON (m.stream_id) m.stream_id,
              ST_Transform(m.location, 3857) as projected_location
            FROM measurements m
            WHERE m.stream_id IN (?)
            ORDER BY m.stream_id, RANDOM()
          )
          SELECT
            rm.stream_id,
            rm.projected_location,
            ST_ClusterDBSCAN(rm.projected_location, eps := ?, minpoints := 1) OVER () as cluster_id
          FROM
            random_measurements rm
        SQL
      ])

      # Execute the query
      result = ActiveRecord::Base.connection.exec_query(sql)

      # Group the results by cluster_id while keeping the location data
      clusters = result.rows.group_by { |row| row[2] } # row[2] is the cluster_id
      clusters.transform_values { |rows| rows.map { |row| [row[0], row[1]] } } # Keep both stream_id and location
    end


    def calculate_centroids_for_clusters(clusters)
      clusters.map do |cluster_id, measurements|
        # Extract the hex-encoded WKT locations for this cluster
        wkts = measurements.map { |_, wkt| wkt }.reject(&:blank?)

        # Skip clusters with no valid geometries
        next if wkts.empty?

        # Convert the hex-encoded EWKB to WKT using ST_AsText
        wkts_as_text = wkts.map { |wkt| "ST_GeomFromEWKB('\\x#{wkt}')" }

        # Create a PostGIS query to calculate the centroid and transform it back to EPSG:4326
        centroid_sql = <<-SQL
          SELECT
            ST_X(ST_Transform(ST_Centroid(ST_Collect(ARRAY[#{wkts_as_text.join(', ')}])), 4326)) AS longitude,
            ST_Y(ST_Transform(ST_Centroid(ST_Collect(ARRAY[#{wkts_as_text.join(', ')}])), 4326)) AS latitude
        SQL

        # Execute the query to get the centroid coordinates
        centroid_result = ActiveRecord::Base.connection.exec_query(centroid_sql).first

        {
          cluster_id: cluster_id,
          latitude: centroid_result['latitude'].to_f,
          longitude: centroid_result['longitude'].to_f,
          stream_ids: measurements.map { |measurement| measurement[0] }, # Extract stream_ids
          session_count: measurements.size
        }
      end.compact # Remove any nil results for clusters with no valid geometries
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
