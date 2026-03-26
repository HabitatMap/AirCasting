module Timelapse
  class GovernmentClustersCreator
    def initialize(
      station_streams_repository: StationStreamsRepository.new,
      station_measurements_repository: StationMeasurementsRepository.new
    )
      @station_streams_repository = station_streams_repository
      @station_measurements_repository = station_measurements_repository
    end

    def call(params:)
      zoom_level = params[:zoom_level].to_f

      station_streams = fetch_station_streams(params)
      clusters = build_clusters(station_streams, zoom_level)
      build_timelapse_result(clusters)
    end

    private

    attr_reader :station_streams_repository, :station_measurements_repository

    def fetch_station_streams(params)
      station_streams_repository.active_in_last_7_days_in_rectangle(
        sensor_name: params[:sensor_name],
        west: params[:west],
        east: params[:east],
        north: params[:north],
        south: params[:south],
      )
    end

    def build_clusters(station_streams, zoom_level)
      locatables =
        station_streams.map do |ss|
          Locatable.new(
            id: ss.id,
            latitude: ss.location.y,
            longitude: ss.location.x,
          )
        end

      raw_clusters = SpatialClusterer.cluster(locatables, zoom_level)

      raw_clusters.map do |raw_cluster|
        {
          latitude: raw_cluster[:latitude],
          longitude: raw_cluster[:longitude],
          station_stream_ids: raw_cluster[:ids],
          session_count: raw_cluster[:count],
        }
      end
    end

    def build_timelapse_result(clusters)
      result = {}

      clusters.each do |cluster|
        averages =
          station_measurements_repository.streams_averages_hourly_last_7_days(
            station_stream_ids: cluster[:station_stream_ids],
          )

        averages.each do |average|
          result[average[:time]] ||= []
          result[average[:time]] << {
            'value' => average[:value],
            'latitude' => cluster[:latitude],
            'longitude' => cluster[:longitude],
            'sessions' => cluster[:session_count],
          }
        end
      end

      result
    end
  end
end
