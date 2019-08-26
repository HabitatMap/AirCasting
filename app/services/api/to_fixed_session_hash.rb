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

    Success.new(
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensorName: session.streams.first.sensor_name,
      measurements: measurements(session, data.measurements_limit),
      startTime: format_time(session.start_time_local),
      endTime: format_time(session.end_time_local),
      id: session.id,
      streamIds: session.streams.map(&:id),
      sensorUnit: session.streams.first.unit_symbol
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

  def measurements(session, limit = nil)
    @measurements ||=
      session.streams.first.measurements.reorder(time: :desc).limit(limit)
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
