module Eea
  module Stations
    class DataParser
      def call(file_path:)
        stations = []

        CSV.foreach(file_path, headers: true) do |row|
          measurement_type = normalized_measurement_type(row['Air Pollutant'])
          unless GovernmentSources::Stations.supported_measurement_type?(
                   measurement_type,
                 )
            next
          end

          station = build_station(row, measurement_type)
          stations << station if station.valid?
        end

        GovernmentSources::Stations.deduplicate(stations)
      end

      private

      def normalized_measurement_type(pollutant)
        pollutant == 'O3' ? 'Ozone' : pollutant
      end

      def build_station(row, measurement_type)
        GovernmentSources::Station.new(
          external_ref: row['Sampling Point Id'],
          measurement_type: measurement_type,
          latitude: GovernmentSources::Stations.to_float(row['Latitude']),
          longitude: GovernmentSources::Stations.to_float(row['Longitude']),
          title:
            row['Air Quality Station Name'].presence ||
              row['Sampling Point Id'],
        )
      end
    end
  end
end
