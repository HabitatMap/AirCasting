class Api::ToSessionHash
  def initialize(model:)
    @model = model
  end

  def call(form:)
    return Failure.new(form.errors) if form.invalid?

    session = @model
      .includes(streams: [:measurements])
      .where(id: form.to_h[:id], streams: { sensor_name: form.to_h[:sensor_name]})
      .first!

    Success.new(
      title: session.title,
      username: session.user.username,
      sensor_name: session.streams.first.sensor_name,
      average: average(measurements(session)),
      measurements: measurements(session),
      startTime: format_time(session.start_time_local),
      endTime: format_time(session.end_time_local),
      id: session.id,
    )
  end

  private

  def format_time(time)
    time.to_datetime.strftime("%Q").to_i
  end

  def average(xs)
    xs.inject(:+).to_f / xs.length
  end

  def measurements(session)
    @measurements ||= session.streams.first.measurements.map(&:value)
  end
end

