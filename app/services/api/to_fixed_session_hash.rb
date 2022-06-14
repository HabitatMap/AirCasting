class Api::ToFixedSessionHash
  def initialize(measurements_limit:, stream:)
    @measurements_limit = measurements_limit
    @stream = stream
  end

  def call
    {
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensor_name: stream.sensor_name,
      measurements: measurements(stream, measurements_limit),
      start_time: format_time(session.start_time_local),
      end_time: format_time(session.end_time_local),
      id: session.id,
      stream_id: stream.id,
      sensor_unit: stream.unit_symbol,
      latitude: session.latitude,
      longitude: session.longitude,
      max_latitude: stream.max_latitude,
      max_longitude: stream.max_longitude,
      min_latitude: stream.min_latitude,
      min_longitude: stream.min_longitude,
      notes: notes.map(&:as_json),
      is_indoor: session.is_indoor,
      last_measurement_value: stream.average_value,
      threshold_high: stream.threshold_high,
      threshold_low: stream.threshold_low,
      threshold_medium: stream.threshold_medium,
      threshold_very_high: stream.threshold_very_high,
      threshold_very_low: stream.threshold_very_low,
      unit_name: stream.unit_name,
      measurement_short_type: stream.measurement_short_type,
      measurement_type: stream.measurement_type,
    }
  end

  private

  attr_reader :stream, :measurements_limit

  def session
    @session ||= stream.session
  end

  def notes
    @notes ||= session.notes
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
