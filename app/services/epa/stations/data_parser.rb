module Epa
  module Stations
    # Parses Monitoring_Site_Locations_V2.dat: one row per (monitor, parameter).
    class DataParser
      HEADER_FIRST_FIELD = 'StationID'.freeze
      # The id HourlyData reports under, so the stream's external_ref.
      FIELD_STATION_ID = 0
      # The site's id, shared by every monitor at the site, so the station's
      # external_ref. One StationID always maps to one FullAQSID.
      FIELD_FULL_AQSID = 2
      FIELD_PARAMETER_NAME = 3
      FIELD_MONITOR_TYPE = 4
      FIELD_SITE_NAME = 6
      FIELD_LATITUDE = 11
      FIELD_LONGITUDE = 12

      MONITOR_TYPE_TEMPORARY = 'Temporary'.freeze

      def call(data:)
        rows = []

        data.each_line do |line|
          fields = line.strip.split('|', -1)
          next if fields[0] == HEADER_FIRST_FIELD

          measurement_type =
            Epa.normalized_measurement_type(fields[FIELD_PARAMETER_NAME])
          unless GovernmentSources::StationStreamRows.supported_measurement_type?(
                   measurement_type,
                 )
            next
          end

          row = build_row(fields, measurement_type)
          rows << row if importable?(row)
        end

        GovernmentSources::StationStreamRows.deduplicate(rows)
      end

      private

      def build_row(fields, measurement_type)
        GovernmentSources::StationStreamRow.new(
          external_ref: fields[FIELD_STATION_ID],
          station_external_ref: fields[FIELD_FULL_AQSID],
          measurement_type: measurement_type,
          latitude: GovernmentSources.to_float(fields[FIELD_LATITUDE]),
          longitude: GovernmentSources.to_float(fields[FIELD_LONGITUDE]),
          title:
            sanitize_title(fields[FIELD_SITE_NAME]) || fields[FIELD_STATION_ID],
          excluded_reason: excluded_reason(fields[FIELD_MONITOR_TYPE]),
        )
      end

      # A row without a real position is dropped whole: a new stream is not
      # created at 0,0, and an existing one keeps the point it already has.
      def importable?(row)
        row.valid? && row.station_external_ref.present? &&
          GovernmentSources.real_position?(
            row.latitude,
            row.longitude,
          )
      end

      # Temporary monitors keep their id while they move between deployments,
      # so their coordinates do not describe a fixed site.
      def excluded_reason(monitor_type)
        return unless monitor_type == MONITOR_TYPE_TEMPORARY

        ::Station::EXCLUDED_REASONS[:temporary]
      end

      def sanitize_title(title)
        return nil if title.blank?

        Epa.sanitize_data(title)
      end
    end
  end
end
