module GovernmentSources
  EARTH_RADIUS_M = 6_371_000

  module_function

  def to_float(value)
    Float(value, exception: false)
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
