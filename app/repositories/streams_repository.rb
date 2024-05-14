class StreamsRepository
  def find(id)
    Stream.find(id)
  end

  def find_by_id(id)
    Stream.find_by_id(id)
  end

  def find_fixed_stream!(id:)
    Stream
      .includes(session: :user)
      .joins(:session)
      .where('sessions.type = ?', 'FixedSession')
      .find(id)
  end

  def calculate_bounding_box!(
    stream,
    calculator = Outliers::CalculateBoundingBox.new
  )
    measurements = stream.measurements.select(%i[latitude longitude])
    calculate_bounding_box(stream, measurements, calculator)
    stream.save!
  end

  def calculate_bounding_box(
    stream,
    measurements,
    calculator = Outliers::CalculateBoundingBox.new
  )
    bounding_box = calculator.call(measurements)
    stream.min_latitude = bounding_box.fetch(:min_latitude)
    stream.max_latitude = bounding_box.fetch(:max_latitude)
    stream.min_longitude = bounding_box.fetch(:min_longitude)
    stream.max_longitude = bounding_box.fetch(:max_longitude)
  end

  def calculate_average_value!(stream)
    if stream.fixed?
      raise 'average_value for fixed streams should be the last measurement value'
    end
    stream.average_value = stream.measurements.average(:value)
    stream.save!
  end

  def add_start_coordinates!(stream)
    first_measurement = stream.measurements.order(time: :asc).first
    stream.start_longitude = first_measurement.longitude
    stream.start_latitude = first_measurement.latitude
    stream.save!
  end

  def thresholds(stream_id:)
    stream = Stream.find(stream_id)
    default_thresholds = DefaultThreshold.find_by(sensor_name: stream.sensor_name, unit_symbol: stream.unit_symbol)
    source = default_thresholds || stream

    {
      threshold_very_low: source.threshold_very_low,
      threshold_low: source.threshold_low,
      threshold_medium: source.threshold_medium,
      threshold_high: source.threshold_high,
      threshold_very_high: source.threshold_very_high
    }
  end
end
