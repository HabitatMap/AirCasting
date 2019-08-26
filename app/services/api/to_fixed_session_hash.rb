class Api::ToFixedSessionHash
  def initialize(model:, form:)
    @model = model
    @form = form
  end

  def call()
    return Failure.new(form.errors) if form.invalid?

    session =
      @model.includes(:streams).where(
        id: data.id, streams: { sensor_name: data.sensor_name }
      )
        .first!
    stream = session.streams.first
    notes = session.notes.map(&:as_json)

    Success.new(
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensorName: stream.sensor_name,
      measurements: measurements(stream, data.measurements_limit),
      startTime: format_time(session.start_time_local),
      endTime: format_time(session.end_time_local),
      id: session.id,
      streamIds: session.streams.map(&:id),
      sensorUnit: stream.unit_symbol,
      latitude: session.latitude,
      longitude: session.longitude,
      maxLatitude: stream.max_latitude,
      maxLongitude: stream.max_longitude,
      minLatitude: stream.min_latitude,
      minLongitude: stream.min_longitude,
      notes: notes,
      isIndoor: session.is_indoor,
      lastHourAverage: last_hour_average(stream),
    )
  end

  private

  attr_reader :form

  def data
    form.to_h
  end

  def format_time(time)
    time.to_datetime.strftime('%Q').to_i
  end

  def last_hour_average(stream)
    last_measurement_time = stream.measurements.last.time
    measurements =
      stream.measurements.where(
        time: last_measurement_time - 1.hour..last_measurement_time
      )
    measurements.average(:value)
  end

  def measurements(stream, limit = nil)
    @measurements ||=
      stream.measurements.reorder(time: :desc).limit(limit)
        .map do |m|
        {
          value: m.value,
          time: format_time(m.time),
          longitude: m.longitude,
          latitude: m.latitude
        }
      end.reverse
  end
end
