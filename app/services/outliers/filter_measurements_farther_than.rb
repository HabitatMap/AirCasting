class Outliers::FilterMeasurementsFartherThan
  def initialize(
    max_distance,
    threshold,
    calculate_distance = Outliers::CalculateDistance.new
  )
    @max_distance = max_distance
    @calculate_distance = calculate_distance
    @threshold = threshold
  end

  def call(centroid, measurements)
    filtered = filter(centroid, measurements)
    filtered_or_all(filtered, measurements)
  end

  private

  def filter(centroid, measurements)
    measurements.reduce([]) do |filtered, measurement|
      lng_lat = [measurement.longitude, measurement.latitude]
      filtered << measurement if @calculate_distance.call(lng_lat, centroid) <= @max_distance
      filtered
    end
  end

  def filtered_or_all(filtered, measurements)
    percentage = 1 - filtered.size.to_f / measurements.size.to_f

    percentage > @threshold ?
      measurements :
      filtered
  end
end
