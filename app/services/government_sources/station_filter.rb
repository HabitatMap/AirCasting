module GovernmentSources
  class StationFilter
    def initialize(repository: Repository.new)
      @repository = repository
    end

    def call(stations:, source_name:)
      return [] if stations.empty?

      existing_keys = repository.existing_station_keys(source_name: source_name)

      stations.reject do |station|
        existing_keys.include?([station.measurement_type, station.external_ref])
      end
    end

    private

    attr_reader :repository
  end
end
