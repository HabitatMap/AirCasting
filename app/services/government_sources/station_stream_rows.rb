module GovernmentSources
  module StationStreamRows
    SUPPORTED_MEASUREMENT_TYPES = %w[PM2.5 Ozone NO2].freeze

    module_function

    def supported_measurement_type?(measurement_type)
      SUPPORTED_MEASUREMENT_TYPES.include?(measurement_type)
    end

    def deduplicate(rows)
      rows.uniq { |row| [row.external_ref, row.measurement_type] }
    end
  end
end
