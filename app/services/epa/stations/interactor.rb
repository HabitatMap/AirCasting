module Epa
  module Stations
    class Interactor
      def initialize(
        api_client: Epa::ApiClient.new,
        data_parser: DataParser.new,
        stations_upserter: GovernmentSources::StationsUpserter.new,
        station_streams_updater: GovernmentSources::StationStreamsUpdater.new,
        station_filter: GovernmentSources::StationFilter.new,
        station_enricher: GovernmentSources::StationEnricher.new,
        station_streams_creator: GovernmentSources::StationStreamsCreator.new
      )
        @api_client = api_client
        @data_parser = data_parser
        @stations_upserter = stations_upserter
        @station_streams_updater = station_streams_updater
        @station_filter = station_filter
        @station_enricher = station_enricher
        @station_streams_creator = station_streams_creator
      end

      def call
        data = api_client.fetch_locations
        stations = data_parser.call(data: data)
        stations = stations_upserter.call(stations: stations, source_name: :epa)

        station_streams_updater.call(stations: stations, source_name: :epa)

        new_stations = station_filter.call(stations: stations, source_name: :epa)
        new_stations =
          station_enricher.call(stations: new_stations, source_name: :epa)
        station_streams_creator.call(stations: new_stations)
      end

      private

      attr_reader :api_client,
                  :data_parser,
                  :stations_upserter,
                  :station_streams_updater,
                  :station_filter,
                  :station_enricher,
                  :station_streams_creator
    end
  end
end
