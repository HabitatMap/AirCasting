class StreamsRepository
  def find(id)
    Stream.find(id)
  end

  def find_by_id(id)
    Stream.find_by_id(id)
  end

  def calc_bounding_box!(
    stream, calculate_bounding_box = Outliers::CalculateBoundingBox.new
  )
    measurements = stream.measurements.select(%i[latitude longitude])
    bounding_box = calculate_bounding_box.call(measurements)
    stream.min_latitude = bounding_box.fetch(:min_latitude)
    stream.max_latitude = bounding_box.fetch(:max_latitude)
    stream.min_longitude = bounding_box.fetch(:min_longitude)
    stream.max_longitude = bounding_box.fetch(:max_longitude)
    stream.save!
  end

  def calc_average_value!(stream)
    stream.average_value = stream.measurements.average(:value)
    stream.save!
  end

  def add_start_coordinates!(stream)
    first_measurement = stream.measurements.order(time: :asc).first
    #we should change that to use created_at once it's implemented
    stream.start_longitude = first_measurement.longitude
    stream.start_latitude = first_measurement.latitude
    stream.save!
  end
end
