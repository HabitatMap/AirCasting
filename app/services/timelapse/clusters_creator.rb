module Timelapse
  class ClustersCreator
    def initialize
      @streams_repository = StreamsRepository.new
      @cluster_processor = ClusterProcessor.new
      @sessions_repository = SessionsRepository.new
    end

    def call(contract:)
      return Failure.new(contract.errors.to_h) if contract.failure?
      params = contract.to_h

      zoom_level = params[:zoom_level].to_f
      sensor_name = params[:sensor_name]

      streams = fetch_streams(params)
      clusters = cluster_streams(streams, zoom_level)

      result =
        cluster_processor.call(clusters: clusters, sensor_name: sensor_name)

      Success.new(result)
    end

    private

    attr_reader :streams_repository, :cluster_processor, :sessions_repository

    def fetch_streams(params)
      sessions = filtered_sessions(params)
      streams = streams_repository.find_by_session_id(sessions.pluck(:id))
      streams.select do |stream|
        Sensor
          .sensor_name(params[:sensor_name])
          .include?(stream.sensor_name.downcase)
      end
    end

    def filtered_sessions(params)
      sessions_repository.active_in_last_7_days.filter_(params)
    end

    def cluster_streams(streams, zoom_level)
      locatables =
        streams.map do |stream|
          Locatable.new(
            id: stream.id,
            latitude: stream.session.latitude,
            longitude: stream.session.longitude,
          )
        end

      raw_clusters = SpatialClusterer.cluster(locatables, zoom_level)

      raw_clusters.map do |raw_cluster|
        {
          latitude: raw_cluster[:latitude],
          longitude: raw_cluster[:longitude],
          stream_ids: raw_cluster[:ids],
          session_count: raw_cluster[:count],
        }
      end
    end
  end
end
