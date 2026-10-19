module Eea
  module Stations
    class Interactor
      DEFAULT_DIRECTORY = 'app/services/eea/stations/data'.freeze

      def initialize(
        data_parser: DataParser.new,
        station_stream_filter: GovernmentSources::LegacyStationStreamFilter.new,
        station_stream_enricher: GovernmentSources::LegacyStationStreamEnricher.new,
        fixed_streams_creator: GovernmentSources::FixedStreamsCreator.new
      )
        @data_parser = data_parser
        @station_stream_filter = station_stream_filter
        @station_stream_enricher = station_stream_enricher
        @fixed_streams_creator = fixed_streams_creator
      end

      def call(directory: DEFAULT_DIRECTORY)
        csv_paths = Dir.glob(File.join(directory, '*.csv'))

        csv_paths.each do |csv_path|
          rows = data_parser.call(file_path: csv_path)
          rows = station_stream_filter.call(rows: rows, source_name: :eea)
          rows =
            station_stream_enricher.call(rows: rows, source_name: :eea)

          fixed_streams_creator.call(rows: rows, source_name: :eea)
        end
      end

      private

      attr_reader :data_parser,
                  :station_stream_filter,
                  :station_stream_enricher,
                  :fixed_streams_creator
    end
  end
end
