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
      average: session.streams.first.average_value,
      measurements: session.streams.first.measurements.map(&:value),
      timeRange: "#{format_datetime(session.start_time_local)} - #{format_datetime(session.end_time_local)}",
      id: session.id,
    )
  end

  private

  def format_datetime(datetime)
    datetime.strftime("%d.%m.%Y %H:%M")
  end
end

