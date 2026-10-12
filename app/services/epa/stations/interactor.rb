module Epa
  module Stations
    class Interactor
      def initialize(
        api_client: Epa::ApiClient.new,
        data_parser: DataParser.new,
        stations_upserter: GovernmentSources::StationsUpserter.new,
        station_streams_updater: GovernmentSources::StationStreamsUpdater.new,
        station_stream_filter: GovernmentSources::StationStreamFilter.new,
        station_stream_enricher: GovernmentSources::StationStreamEnricher.new,
        station_streams_creator: GovernmentSources::StationStreamsCreator.new
      )
        @api_client = api_client
        @data_parser = data_parser
        @stations_upserter = stations_upserter
        @station_streams_updater = station_streams_updater
        @station_stream_filter = station_stream_filter
        @station_stream_enricher = station_stream_enricher
        @station_streams_creator = station_streams_creator
      end

      def call
        data = api_client.fetch_locations
        rows = data_parser.call(data: data)
        rows = stations_upserter.call(rows: rows, source_name: :epa)

        station_streams_updater.call(rows: rows, source_name: :epa)

        new_rows = station_stream_filter.call(rows: rows, source_name: :epa)
        new_rows =
          station_stream_enricher.call(rows: new_rows, source_name: :epa)
        station_streams_creator.call(rows: new_rows)
      end

      private

      attr_reader :api_client,
                  :data_parser,
                  :stations_upserter,
                  :station_streams_updater,
                  :station_stream_filter,
                  :station_stream_enricher,
                  :station_streams_creator
    end
  end
end
