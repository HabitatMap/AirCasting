module GovernmentSources
  module Stations
    SUPPORTED_MEASUREMENT_TYPES = %w[PM2.5 Ozone NO2].freeze
    EARTH_RADIUS_M = 6_371_000

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

    # Sources publish 0,0 (and EPA also 90,0) when they have no position for a
    # site. Such a point is not a place, so it must never be stored over a real
    # one or shown on the map.
    def real_position?(latitude, longitude)
      return false if latitude.nil? || longitude.nil?

      !(longitude.zero? && (latitude.zero? || latitude == 90))
    end

    def same_point?(location, latitude, longitude)
      location.present? && location.x == longitude && location.y == latitude
    end

    def distance_m(lat1, lon1, lat2, lon2)
      rad = Math::PI / 180
      dlat = (lat2 - lat1) * rad
      dlon = (lon2 - lon1) * rad
      a =
        (Math.sin(dlat / 2)**2) +
          (Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * (Math.sin(dlon / 2)**2))
      2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
    end
  end
end
