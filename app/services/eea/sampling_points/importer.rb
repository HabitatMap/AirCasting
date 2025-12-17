module Eea
  module SamplingPoints
    class Importer
      def initialize
        @time_zone_finder = TimeZoneFinderWrapper.instance
        @token_generator = TokenGenerator.new
      end

      def call(file_path:)
        sampling_points = []

        CSV.foreach(file_path, headers: true) do |row|
          external_ref = row['Sampling Point Id']
          measurement_type = row['Air Pollutant']
          latitude = to_float(row['Latitude'])
          longitude = to_float(row['Longitude'])
          title =
            row['Municipality'].present? ? row['Municipality'] : external_ref
          url_token = get_url_token

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
              url_token: url_token,
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

      attr_reader :time_zone_finder, :token_generator

      def to_float(value)
        return nil if value.nil? || value.to_s.strip.empty?

        begin
          Float(value)
        rescue StandardError
          nil
        end
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

      def get_url_token
        token =
          token_generator.generate_unique(6) do |token|
            FixedStream.where(url_token: token).count.zero?
          end

        token
      end
    end
  end
end
