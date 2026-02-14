module GovernmentSources
  class StationEnricher
    def initialize(
      repository: Repository.new,
      time_zone_finder: TimeZoneFinderWrapper.instance,
      token_generator: TokenGenerator.new
    )
      @repository = repository
      @time_zone_finder = time_zone_finder
      @token_generator = token_generator
    end

    def call(stations:, source_name:)
      return [] if stations.empty?

      source_id = repository.source_id(source_name: source_name)

      stations.each do |station|
        station.location = build_location(station.latitude, station.longitude)
        station.time_zone = time_zone_for(station.latitude, station.longitude)
        station.source_id = source_id
        station.stream_configuration_id =
          repository.stream_configurations[station.measurement_type]&.id
        station.url_token = generate_url_token
      end

      stations
    end

    private

    attr_reader :repository, :time_zone_finder, :token_generator

    def build_location(latitude, longitude)
      factory = RGeo::Geographic.spherical_factory(srid: 4326)

      factory.point(longitude, latitude)
    end

    def time_zone_for(latitude, longitude)
      time_zone_finder.time_zone_at(lat: latitude, lng: longitude)
    end

    def generate_url_token
      token_generator.generate_unique(6) do |token|
        FixedStream.where(url_token: token).count.zero?
      end
    end
  end
end
