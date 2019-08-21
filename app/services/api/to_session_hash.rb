class Api::ToSessionHash
  def initialize(model:)
    @model = model
  end

  def call(form:)
    return Failure.new(form.errors) if form.invalid?

    session =
      @model.includes(streams: [:measurements]).where(
        id: form.to_h[:id], streams: { sensor_name: form.to_h[:sensor_name] }
      )
        .first!

    Success.new(
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensorName: session.streams.first.sensor_name,
      measurements: measurements(session),
      startTime: format_time(session.start_time_local),
      endTime: format_time(session.end_time_local),
      id: session.id,
      streamIds: session.streams.map(&:id),
      sensorUnit: session.streams.first.unit_symbol
    )
  end

  private

  def format_time(time)
    time.to_datetime.strftime('%Q').to_i
  end

  def measurements(session)
    @measurements ||= session.streams.first.measurements.map { |m|
      {value: m.value, time: format_time(m.time), longitude: m.longitude, latitude: m.latitude}
    }
  end
end
