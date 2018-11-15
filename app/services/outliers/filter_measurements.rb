class Outliers::FilterMeasurements
  # Since New York is located ~ (40.6971494, -74.259869) and Pittsburgh ~ (40.4313473,-80.0505407), 5 for MAX_DISTANCE
  # the distance in between. In fact, sqrt[(40.6971494 - 40.4313473)^2 + (-74.259869 - -80.0505407)^2] ~= 5
  MAX_DISTANCE = 5

  def initialize(
    max_distance = MAX_DISTANCE,
    calculate_centroid = Outliers::CalculateCentroid.new,
    calculate_distance = Outliers::CalculateDistance.new
  )
    @max_distance = max_distance
    @calculate_centroid = calculate_centroid
    @calculate_distance = calculate_distance
  end

  def call(measurements)
    return measurements unless measurements.any?

    centroid = @calculate_centroid.call(measurements)
    filter_outliers(centroid, measurements, @max_distance)
  end

  private

  def filter_outliers(centroid, measurements, max_distance)
    measurements.select do |measurement|
      lng_lat = [measurement.longitude, measurement.latitude]
      @calculate_distance.call(lng_lat, centroid) <= max_distance
    end
  end
end

