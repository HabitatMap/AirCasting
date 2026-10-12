module GovernmentSources
  class LegacyStationStreamEnricher
    def initialize(
      repository: Repository.new,
      time_zone_finder: TimeZoneFinderWrapper.instance,
      token_generator: TokenGenerator.new
    )
      @repository = repository
      @time_zone_finder = time_zone_finder
      @token_generator = token_generator
    end

    def call(rows:, source_name:)
      return [] if rows.empty?

      source_id = repository.source_id(source_name: source_name)
      stream_configurations = repository.stream_configurations

      rows.each do |row|
        row.location = build_location(row.latitude, row.longitude)
        row.time_zone = time_zone_for(row.latitude, row.longitude)
        row.source_id = source_id
        row.stream_configuration_id =
          stream_configurations[row.measurement_type]&.id
        row.url_token = generate_url_token
      end

      rows
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
