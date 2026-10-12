module Eea
  module Stations
    class DataParser
      def call(file_path:)
        rows = []

        CSV.foreach(file_path, headers: true) do |csv_row|
          measurement_type = normalized_measurement_type(csv_row['Air Pollutant'])
          unless GovernmentSources::StationStreamRows.supported_measurement_type?(
                   measurement_type,
                 )
            next
          end

          row = build_row(csv_row, measurement_type)
          rows << row if row.valid?
        end

        GovernmentSources::StationStreamRows.deduplicate(rows)
      end

      private

      def normalized_measurement_type(pollutant)
        pollutant == 'O3' ? 'Ozone' : pollutant
      end

      def build_row(csv_row, measurement_type)
        GovernmentSources::StationStreamRow.new(
          external_ref: csv_row['Sampling Point Id'],
          measurement_type: measurement_type,
          latitude: GovernmentSources.to_float(csv_row['Latitude']),
          longitude: GovernmentSources.to_float(csv_row['Longitude']),
          title:
            csv_row['Air Quality Station Name'].presence ||
              csv_row['Sampling Point Id'],
        )
      end
    end
  end
end
