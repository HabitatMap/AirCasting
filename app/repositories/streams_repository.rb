class StreamsRepository
  def find(id)
    Stream.find(id)
  end

  def calc_bounding_box!(stream)
    stream.min_latitude = stream.measurements.minimum(:latitude)
    stream.max_latitude = stream.measurements.maximum(:latitude)
    stream.min_longitude = stream.measurements.minimum(:longitude)
    stream.max_longitude = stream.measurements.maximum(:longitude)
    stream.save!
  end

  def calc_average_value!(stream)
    stream.average_value = stream.measurements.average(:value)
    stream.save!
  end
end
