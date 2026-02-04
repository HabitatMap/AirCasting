module Eea
  module SamplingPoints
    class Importer
      SUPPORTED_POLLUTANTS = %w[PM2.5 NO2 O3].freeze

      def initialize
        @time_zone_finder = TimeZoneFinderWrapper.instance
      end

      def call(file_path:)
        sampling_points = []

        CSV.foreach(file_path, headers: true) do |row|
          pollutant = row['Air Pollutant']
          next unless SUPPORTED_POLLUTANTS.include?(pollutant)

          external_ref = row['Sampling Point Id']
          measurement_type = measurement_type(pollutant)
          latitude = to_float(row['Latitude'])
          longitude = to_float(row['Longitude'])
          title =
            if row['Air Quality Station Name'].present?
              row['Air Quality Station Name']
            else
              external_ref
            end

          if external_ref.nil? || measurement_type.nil? || latitude.nil? ||
               longitude.nil?
            next
          end

          sampling_points <<
            SamplingPoint.new(
              external_ref: external_ref,
              measurement_type: measurement_type,
              latitude: latitude,
              longitude: longitude,
              title: title,
            )
        end

        sampling_points =
          sampling_points.uniq { |sp| [sp.external_ref, sp.measurement_type] }
        sampling_points.map do |sp|
          sp.location = location(sp.latitude, sp.longitude)
          sp.time_zone = time_zone_for(sp.latitude, sp.longitude)
          sp.source_id = source_id
          sp.stream_configuration_id =
            stream_configurations[sp.measurement_type]&.id
        end

        sampling_points
      end

      private

      attr_reader :time_zone_finder

      def measurement_type(pollutant)
        pollutant == 'O3' ? 'Ozone' : pollutant
      end

      def to_float(value)
        Float(value)
      rescue ArgumentError, TypeError
        nil
      end

      def time_zone_for(latitude, longitude)
        time_zone_finder.time_zone_at(lat: latitude, lng: longitude)
      end

      def location(latitude, longitude)
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        factory.point(longitude, latitude)
      end

      def source_id
        @source_id ||= Source.find_by!(name: 'EEA').id
      end

      def stream_configurations
        @stream_configurations ||=
          StreamConfiguration
            .where(canonical: true)
            .index_by(&:measurement_type)
      end
    end
  end
end
