module GovernmentSources
  class StationStreamsCreator
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(stations:)
      return if stations.empty?

      records = build_station_streams(stations)
      repository.upsert_station_streams(records:)
    end

    private

    attr_reader :repository

    def build_station_streams(stations)
      current_time = Time.current
      stations.map { |station| build_station_stream(station, current_time) }
    end

    def build_station_stream(station, current_time)
      {
        external_ref: station.external_ref,
        location: station.location,
        time_zone: station.time_zone,
        title: station.title,
        url_token: station.url_token,
        source_id: station.source_id,
        stream_configuration_id: station.stream_configuration_id,
        created_at: current_time,
        updated_at: current_time,
      }
    end
  end
end
