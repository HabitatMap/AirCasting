module Eea
  module Stations
    class Interactor
      DEFAULT_DIRECTORY = 'app/services/eea/stations/data'.freeze

      def initialize(
        data_parser: DataParser.new,
        station_filter: GovernmentSources::StationFilter.new,
        station_enricher: GovernmentSources::StationEnricher.new,
        fixed_streams_creator: GovernmentSources::FixedStreamsCreator.new
      )
        @data_parser = data_parser
        @station_filter = station_filter
        @station_enricher = station_enricher
        @fixed_streams_creator = fixed_streams_creator
      end

      def call(directory: DEFAULT_DIRECTORY)
        csv_paths = Dir.glob(File.join(directory, '*.csv'))

        csv_paths.each do |csv_path|
          stations = data_parser.call(file_path: csv_path)
          stations = station_filter.call(stations: stations, source: :eea)
          stations = station_enricher.call(stations: stations, source: :eea)

          fixed_streams_creator.call(stations: stations, source_name: :eea)
        end
      end

      private

      attr_reader :data_parser,
                  :station_filter,
                  :station_enricher,
                  :fixed_streams_creator
    end
  end
end
