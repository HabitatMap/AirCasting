class Outliers::CalculateDistance
  def call(lng_lat1, lng_lat2)
    xx1, yy1 = lng_lat1
    xx2, yy2 = lng_lat2

    BigDecimal((xx1 - xx2)**2 + (yy1 - yy2)**2).sqrt(12)
  end
end
