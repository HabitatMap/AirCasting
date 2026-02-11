module Epa
  module Sites
    class DataParser
      SUPPORTED_PARAMETERS = %w[PM2.5 OZONE NO2].freeze

      FIELD_AQSID = 0
      FIELD_PARAMETER_NAME = 1
      FIELD_SITE_NAME = 3
      FIELD_LATITUDE = 8
      FIELD_LONGITUDE = 9

      def initialize(time_zone_finder: TimeZoneFinderWrapper.instance)
        @time_zone_finder = time_zone_finder
      end

      def call(data:)
        sites = []
        sanitized_data = data.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')

        sanitized_data.each_line do |line|
          fields = line.strip.split('|')

          parameter_name = fields[FIELD_PARAMETER_NAME]
          next unless SUPPORTED_PARAMETERS.include?(parameter_name)

          external_ref = fields[FIELD_AQSID]
          measurement_type = normalize_measurement_type(parameter_name)
          latitude = to_float(fields[FIELD_LATITUDE])
          longitude = to_float(fields[FIELD_LONGITUDE])
          title = fields[FIELD_SITE_NAME].presence || external_ref

          next if external_ref.blank? || latitude.nil? || longitude.nil?

          sites <<
            Site.new(
              external_ref: external_ref,
              measurement_type: measurement_type,
              latitude: latitude,
              longitude: longitude,
              title: title,
            )
        end

        sites = deduplicate(sites)
        enrich(sites)

        sites
      end

      private

      attr_reader :time_zone_finder

      def normalize_measurement_type(parameter_name)
        case parameter_name
        when 'OZONE' then 'Ozone'
        else parameter_name
        end
      end

      def to_float(value)
        Float(value)
      rescue ArgumentError, TypeError
        nil
      end

      def deduplicate(sites)
        sites.uniq { |s| [s.external_ref, s.measurement_type] }
      end

      def enrich(sites)
        sites.each do |site|
          site.location = build_location(site.latitude, site.longitude)
          site.time_zone = time_zone_for(site.latitude, site.longitude)
          site.source_id = source_id
          site.stream_configuration_id =
            stream_configurations[site.measurement_type]&.id
        end
      end

      def build_location(latitude, longitude)
        factory = RGeo::Geographic.spherical_factory(srid: 4326)
        factory.point(longitude, latitude)
      end

      def time_zone_for(latitude, longitude)
        time_zone_finder.time_zone_at(lat: latitude, lng: longitude)
      end

      def source_id
        @source_id ||= Source.find_by!(name: 'EPA').id
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
