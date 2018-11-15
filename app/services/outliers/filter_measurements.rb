class Outliers::FilterMeasurements
  # Since San Francisco is ~ (37.7576793,-122.5076403) and Philadelphia ~ (40.0024137,-75.258118), 25 for MAX_DISTANCE
  # means more or less half of the distance between them. In fact,
  # sqrt[(37.7576793 - 40.0024137)^2 + (-122.5076403 - -75.258118)^2] ~= 47.31
  MAX_DISTANCE = 25

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

