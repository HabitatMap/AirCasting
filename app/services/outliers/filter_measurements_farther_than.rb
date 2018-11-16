class Outliers::FilterMeasurementsFartherThan
  def initialize(
    max_distance,
    calculate_distance = Outliers::CalculateDistance.new
  )
    @max_distance = max_distance
    @calculate_distance = calculate_distance
  end

  def call(centroid, measurements)
    measurements.select do |measurement|
      lng_lat = [measurement.longitude, measurement.latitude]
      @calculate_distance.call(lng_lat, centroid) <= @max_distance
    end
  end
end
