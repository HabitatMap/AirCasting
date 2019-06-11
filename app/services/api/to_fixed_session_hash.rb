class Api::ToFixedSessionHash
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    session = FixedSession.includes(:streams).find(id)
    stream = session.streams.where(sensor_name: sensor_name).first!
    user = session.user

    Success.new(
      title: session.title,
      id: session.id,
      contribute: session.contribute,
      created_at: format_time(session.created_at),
      data_type: session.data_type,
      end_time: format_time(session.end_time),
      end_time_local: format_time(session.end_time_local),
      instrument: session.instrument,
      is_indoor: session.is_indoor,
      last_measurement_at: session.last_measurement_at,
      latitude: session.latitude,
      longitude: session.longitude,
      measurements_count: session.measurements_count,
      start_time: format_time(session.start_time),
      start_time_local: format_time(session.start_time_local),
      type: session.type,
      updated_at: format_time(session.updated_at),
      url_token: session.url_token,
      user_id: user.id,
      uuid: session.uuid,
      last_hour_average: last_hour_average(stream),
      streams: {
        stream.sensor_name => {
          average_value: stream.average_value,
          id: stream.id,
          max_latitude: stream.max_latitude,
          max_longitude: stream.max_longitude,
          measurement_short_type: stream.measurement_short_type,
          measurement_type: stream.measurement_type,
          measurements_count: stream.measurements_count,
          min_latitude: stream.min_latitude,
          min_longitude: stream.min_longitude,
          sensor_name: stream.sensor_name,
          sensor_package_name: stream.sensor_package_name,
          session_id: session.id,
          size: stream.size,
          start_latitude: stream.start_latitude,
          start_longitude: stream.start_longitude,
          threshold_high: stream.threshold_high,
          threshold_low: stream.threshold_low,
          threshold_medium: stream.threshold_medium,
          threshold_very_high: stream.threshold_very_high,
          threshold_very_low: stream.threshold_very_low,
          unit_name: stream.unit_name,
          unit_symbol: stream.unit_symbol
        }
      }
    )
  end

  private

  attr_reader :form

  def last_hour_average(stream)
    last_measurement_time = stream.measurements.last.time
    measurements =
      stream.measurements.where(
        time: last_measurement_time - 1.hour..last_measurement_time
      )
    measurements.average(:value)
  end

  def format_time(time)
    time.strftime('%FT%T.000Z')
  end

  def id
    form.to_h.id
  end

  def sensor_name
    form.to_h.sensor_name
  end
end
