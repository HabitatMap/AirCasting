class Api::ToFixedSessionWithStreamsHash
  def initialize(session:, measurements_limit:)
    @session = session
    @measurements_limit = measurements_limit
  end

  def call
    {
      id: session.id,
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      start_time: format_time(session.start_time_local),
      end_time: format_time(session.end_time_local),
      latitude: session.latitude,
      longitude: session.longitude,
      notes: session.notes.map(&:as_json),
      is_indoor: session.is_indoor,
      streams: session.streams.map do |stream|
        {
          stream_id: stream.id,
          sensor_name: stream.sensor_name,
          last_measurement_value: stream.average_value,
          max_latitude: stream.max_latitude,
          max_longitude: stream.max_longitude,
          measurements: measurements(stream),
          min_latitude: stream.min_latitude,
          min_longitude: stream.max_longitude,
          sensor_unit: stream.unit_symbol,
          threshold_very_low: stream.threshold_set.threshold_very_low,
          threshold_low: stream.threshold_set.threshold_low,
          threshold_medium: stream.threshold_set.threshold_medium,
          threshold_high: stream.threshold_set.threshold_high,
          threshold_very_high: stream.threshold_set.threshold_very_high,
          unit_name: stream.unit_name,
          measurement_short_type: stream.measurement_short_type,
          measurement_type: stream.measurement_type,
        }
      end
    }
  end

  private
  attr_reader :session, :measurements_limit

  def format_time(time)
    time.to_datetime.strftime('%Q').to_i
  end

  def measurements(stream)
    stream
      .measurements
      .reorder(time: :desc)
      .limit(measurements_limit)
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
