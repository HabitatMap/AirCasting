module Epa
  module Stations
    class Interactor
      def initialize(
        api_client: Epa::ApiClient.new,
        data_parser: DataParser.new,
        station_filter: GovernmentSources::StationFilter.new,
        station_enricher: GovernmentSources::StationEnricher.new,
        station_streams_creator: GovernmentSources::StationStreamsCreator.new
      )
        @api_client = api_client
        @data_parser = data_parser
        @station_filter = station_filter
        @station_enricher = station_enricher
        @station_streams_creator = station_streams_creator
      end

      def call
        data = api_client.fetch_locations
        stations = data_parser.call(data: data)
        stations = station_filter.call(stations: stations, source_name: :epa)
        stations = station_enricher.call(stations: stations, source_name: :epa)

        station_streams_creator.call(stations: stations, source_name: :epa)
      end

      private

      attr_reader :api_client,
                  :data_parser,
                  :station_filter,
                  :station_enricher,
                  :station_streams_creator
    end
  end
end
