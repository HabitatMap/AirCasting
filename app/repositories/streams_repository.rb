class StreamsRepository
  def find(id)
    Stream.find(id)
  end

  def find_by_id(id)
    Stream.find_by_id(id)
  end

  def find_fixed_stream!(id:)
    Stream
      .includes(:threshold_set, session: :user)
      .joins(:session)
      .where('sessions.type = ?', 'FixedSession')
      .find(id)
  end

  def find_by_session_id(session_id)
    Stream.where(session_id: session_id).includes(:session)
  end

  def find_by_session_uuid_and_sensor_name(session_uuid:, sensor_name:)
    Stream
      .joins(:session)
      .find_by(sessions: { uuid: session_uuid }, sensor_name: sensor_name)
  end

  def create!(params:)
    Stream.create!(params)
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

  def update_measurements_count!(stream_id:, measurements_count:)
    Stream.update_counters(stream_id, measurements_count: measurements_count)
  end
end
