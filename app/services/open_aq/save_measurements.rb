class OpenAq::SaveMeasurements
  def call(streams:)
    streams.each do |stream, measurements|
      persisted_session, persisted_stream = find_session_and_stream!(stream)
      if persisted_session && persisted_stream
        FixedSession.transaction do
          update_session!(persisted_session, measurements)
          create_measurements!(persisted_stream, measurements)
        end
      else
        FixedSession.transaction do
          persisted_session = create_session!(stream, measurements)
          persisted_stream = create_stream!(persisted_session, stream)
          create_measurements!(persisted_stream, measurements)
        end
      end
    end
  end

  private

  def user
    @user ||= User.where(username: 'OpenAQ').first!
  end

  def find_session_and_stream!(stream)
    latitude = stream.latitude
    longitude = stream.longitude

    sessions =
      Session.includes(:streams).where(
        latitude: latitude,
        longitude: longitude,
        streams: {
          min_latitude: latitude,
          max_latitude: latitude,
          min_longitude: longitude,
          max_longitude: longitude,
          start_latitude: latitude,
          start_longitude: longitude,
          sensor_name: stream.sensor_name
        }
      )

    if sessions.count > 1
      Rails.logger.error sessions.inspect
      raise 'more than one session found'
    end

    return [] if sessions.none?

    if sessions.first!.streams.count > 1
      Rails.logger.error sessions.first!.streams.inspect
      raise 'more than one stream found'
    end

    [sessions.first!, sessions.first!.streams.first!]
  end

  def update_session!(persisted_session, measurements)
    first = measurements.first
    last = measurements.last

    if persisted_session.start_time > first.time_local
      persisted_session.start_time = first.time_local
    end

    if persisted_session.start_time_local > first.time_local
      persisted_session.start_time_local = first.time_local
    end

    if persisted_session.end_time < last.time_local
      persisted_session.end_time = last.time_local
    end

    if persisted_session.end_time_local < last.time_local
      persisted_session.end_time_local = last.time_local
    end

    if persisted_session.last_measurement_at < last.time_utc
      persisted_session.last_measurement_at = last.time_utc
    end

    unless persisted_session.save
      Rails.logger.error persisted_session.errors.full_messages
      raise 'could not update session'
    end
  end

  def create_session!(stream, measurements)
    first = measurements.first
    last = measurements.last

    persisted_session =
      FixedSession.new(
        user_id: user.id,
        title: [last.location, last.city].join(', '),
        contribute: true,
        start_time: first.time_local,
        end_time: last.time_local,
        start_time_local: first.time_local,
        end_time_local: last.time_local,
        last_measurement_at: last.time_utc,
        is_indoor: false,
        latitude: stream.latitude,
        longitude: stream.longitude,
        data_type: nil,
        instrument: nil,
        uuid: SecureRandom.uuid
      )

    unless persisted_session.save
      Rails.logger.error persisted_session.errors.full_messages
      raise 'could not create session'
    end

    persisted_session
  end

  def create_stream!(persisted_session, stream)
    persisted_stream =
      Stream.new(
        sensor_name: stream.sensor_name,
        unit_name: stream.unit_name,
        measurement_type: stream.measurement_type,
        measurement_short_type: stream.measurement_short_type,
        unit_symbol: stream.unit_symbol,
        threshold_very_low: stream.threshold_very_low,
        threshold_low: stream.threshold_low,
        threshold_medium: stream.threshold_medium,
        threshold_high: stream.threshold_high,
        threshold_very_high: stream.threshold_very_high,
        sensor_package_name: stream.sensor_package_name,
        min_latitude: stream.latitude,
        max_latitude: stream.latitude,
        min_longitude: stream.longitude,
        max_longitude: stream.longitude,
        start_latitude: stream.latitude,
        start_longitude: stream.longitude,
        session: persisted_session
      )

    unless persisted_stream.save
      Rails.logger.error persisted_stream.errors.full_messages
      raise 'could not create stream'
    end

    persisted_stream
  end

  def create_measurements!(persisted_stream, measurements)
    measurements.each do |measurement|
      associated_measurements =
        persisted_stream.measurements.where(time: measurement.time_local)

      if associated_measurements.count > 1
        Rails.logger.error associated_measurements.inspect
        raise 'more than one measurement found'
      end

      next if associated_measurements.one?

      measurement =
        Measurement.new(
          value: measurement.value,
          latitude: measurement.latitude,
          longitude: measurement.longitude,
          time: measurement.time_local,
          timezone_offset: nil,
          milliseconds: 0,
          measured_value: measurement.value,
          stream: persisted_stream
        )

      unless measurement.save
        Rails.logger.error measurement.errors.full_messages
        raise 'could not create measurement'
      end
    end
  end
end
