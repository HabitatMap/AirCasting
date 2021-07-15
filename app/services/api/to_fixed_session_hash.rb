class Api::ToFixedSessionHash
  def initialize(model:, form:)
    @model = model
    @form = form
  end

  def call()
    return Failure.new(form.errors) if form.invalid?

    session =
      @model
        .includes(:streams)
        .where(id: data.id, streams: { sensor_name: data.sensor_name })
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
      streamId: stream.id,
      sensorUnit: stream.unit_symbol,
      latitude: session.latitude,
      longitude: session.longitude,
      maxLatitude: stream.max_latitude,
      maxLongitude: stream.max_longitude,
      minLatitude: stream.min_latitude,
      minLongitude: stream.min_longitude,
      notes: notes,
      isIndoor: session.is_indoor,
      lastHourAverage: stream.last_hour_average
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

  def measurements(stream, limit = nil)
    @measurements ||=
      stream
        .measurements
        .reorder(time: :desc)
        .limit(limit)
        .map do |m|
          {
            value: m.value,
            time: format_time(m.time),
            longitude: m.longitude,
            latitude: m.latitude
          }
        end
        .reverse
  end
end
