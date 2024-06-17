class Api::ToFixedSessionHash
  def initialize(measurements_limit:, stream:)
    @measurements_limit = measurements_limit
    @stream = stream
  end

  def call
    {
      title: session.title,
      username: session.is_indoor ? 'anonymous' : session.user.username,
      sensorName: stream.sensor_name,
      measurements: measurements(stream, measurements_limit),
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
      notes: notes.map(&:as_json),
      isIndoor: session.is_indoor,
      lastMeasurementValue: stream.average_value,
      threshold_high: stream.threshold_set.threshold_high,
      threshold_low: stream.threshold_set.threshold_low,
      threshold_medium: stream.threshold_set.threshold_medium,
      threshold_very_high: stream.threshold_set.threshold_very_high,
      threshold_very_low: stream.threshold_set.threshold_very_low,
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
