module GovernmentSources
  module Stations
    SUPPORTED_MEASUREMENT_TYPES = %w[PM2.5 Ozone NO2].freeze

    module_function

    def supported_measurement_type?(measurement_type)
      SUPPORTED_MEASUREMENT_TYPES.include?(measurement_type)
    end

    def deduplicate(stations)
      stations.uniq { |s| [s.external_ref, s.measurement_type] }
    end

    def to_float(value)
      Float(value)
    rescue ArgumentError, TypeError
      nil
    end
  end
end
