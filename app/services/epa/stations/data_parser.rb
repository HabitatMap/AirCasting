module Epa
  module Stations
    class DataParser
      FIELD_AQSID = 0
      FIELD_PARAMETER_NAME = 1
      FIELD_SITE_NAME = 3
      FIELD_LATITUDE = 8
      FIELD_LONGITUDE = 9

      def call(data:)
        stations = []

        sanitized_data(data).each_line do |line|
          fields = line.strip.split('|')

          measurement_type =
            normalized_measurement_type(fields[FIELD_PARAMETER_NAME])
          unless GovernmentSources::Stations.supported_measurement_type?(
                   measurement_type,
                 )
            next
          end

          station = build_station(fields, measurement_type)
          stations << station if station.valid?
        end

        GovernmentSources::Stations.deduplicate(stations)
      end

      private

      def sanitized_data(data)
        data.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
      end

      def normalized_measurement_type(parameter_name)
        parameter_name == 'OZONE' ? 'Ozone' : parameter_name
      end

      def build_station(fields, measurement_type)
        GovernmentSources::Station.new(
          external_ref: fields[FIELD_AQSID],
          measurement_type: measurement_type,
          latitude: GovernmentSources::Stations.to_float(fields[FIELD_LATITUDE]),
          longitude: GovernmentSources::Stations.to_float(fields[FIELD_LONGITUDE]),
          title: fields[FIELD_SITE_NAME].presence || fields[FIELD_AQSID],
        )
      end
    end
  end
end
