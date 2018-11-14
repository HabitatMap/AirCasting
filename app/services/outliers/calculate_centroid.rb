class Outliers::CalculateCentroid
  def call(measurements)
    lng_lat = sum_coordinates(measurements)
    average(lng_lat, BigDecimal.new(measurements.size))
  end

  private

  def sum_coordinates(measurements)
    measurements.reduce([zero, zero]) do |(lng, lat), x|
      [lng + x.longitude, lat + x.latitude]
    end
  end

  def average(lng_lat, amount)
    lng_lat.map { |x| x / amount }
  end

  def zero
    "0".to_d
  end
end
