class Outliers::FilterMeasurements
  # Since New York is located ~ (40.6971494, -74.259869) and Pittsburgh ~ (40.4313473,-80.0505407), 5 for MAX_DISTANCE
  # the distance in between. In fact, sqrt[(40.6971494 - 40.4313473)^2 + (-74.259869 - -80.0505407)^2] ~= 5
  MAX_DISTANCE = 5

  def initialize(
    calculate_centroid = Outliers::CalculateCentroid.new,
    filter = Outliers::FilterMeasurementsFartherThan.new(MAX_DISTANCE, Outliers::CalculateDistance.new)
  )
    @calculate_centroid = calculate_centroid
    @filter = filter
  end

  def call(measurements)
    return measurements unless measurements.any?

    centroid = @calculate_centroid.call(measurements)
    @filter.call(centroid, measurements)
  end
end
