class SaveMeasurements
  def initialize(user:)
    @user = user
  end

  def call(streams:)
    FixedSession.transaction { save(streams) }
  end

  private

  def save(streams)
    persisted_streams = Stream
      .select(:id, :min_latitude, :min_longitude, :sensor_name, :session_id)
      .joins(:session)
      .where(session: { user_id: user_id })
      .load

    persisted_streams_hash = persisted_streams.each_with_object({}) do |stream, acc|
      acc[[stream.min_latitude, stream.min_longitude, stream.sensor_name]] = [stream.session_id, stream.id]
    end

    old_pairs, new_pairs = streams.to_a.partition do |stream, _measurements|
      persisted_streams_hash.key?([stream.latitude, stream.longitude, stream.sensor_name])
    end

    new_sessions = new_pairs.map do |stream, measurements|
      uuid = SecureRandom.uuid
      last = first = measurements.first

      FixedSession.new(
        user_id: user_id,
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
        uuid: uuid,
        url_token: uuid
      )
    end
    FixedSession.import new_sessions
    last_id = FixedSession.last.id
    ids = ((last_id - new_sessions.size + 1)..last_id).to_a

    old_sessions = old_pairs.each_with_object({}) do |(stream, measurements), acc|
      session_id = persisted_streams_hash[[stream.latitude, stream.longitude, stream.sensor_name]].first
      first = last = measurements.first
      # sort
      acc[session_id] = {
        "id" => session_id,
        "end_time" => last.time_local,
        "end_time_local" => last.time_local,
        "last_measurement_at" => last.time_utc,
      }
    end
    to_load = FixedSession.where(id: old_sessions.keys).map do |s|
      s.attributes.reject { |k, v| k == "tag_list" }.merge(old_sessions.fetch(s.id))
    end
    FixedSession.import to_load, on_duplicate_key_update: [:end_time, :end_time_local, :last_measurement_at]

    old_streams = old_pairs.each_with_object({}) do |(stream, measurements), acc|
      stream_id = persisted_streams_hash[[stream.latitude, stream.longitude, stream.sensor_name]].last
      first = last = measurements.first
      # sort
      acc[stream_id] = {
        "id" => stream_id,
        "average_value" => last.value,
        "measurements_count" => measurements.size,
      }
    end
    to_load = Stream.where(id: old_streams.keys).map do |s|
      to_merge = old_streams.fetch(s.id)
      persisted = s.attributes
      persisted.merge(to_merge).merge("measurements_count" => to_merge.fetch("measurements_count") + persisted.fetch("measurements_count"))
    end
    Stream.import to_load, on_duplicate_key_update: [:average_value, :measurements_count]

    new_streams = new_pairs.map.with_index do |(stream, measurements), i|
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
        session_id: ids[i],
        measurements_count: measurements.size,
        average_value: measurements.last.value
      )
    end
    Stream.import new_streams
    last_id = Stream.last.id
    ids = ((last_id - new_streams.size + 1)..last_id).to_a
    raise "wat?" if new_sessions.size != new_streams.size

    measurements =
      new_pairs.each_with_object([]).with_index do |((stream, measurements), acc), i|
        measurements.each do |measurement|
          acc <<
          Measurement.new(
            value: measurement.value,
            latitude: measurement.latitude,
            longitude: measurement.longitude,
            time: measurement.time_local,
            timezone_offset: nil,
            milliseconds: 0,
            measured_value: measurement.value,
            stream_id: ids[i]
          )
        end
      end
    result = Measurement.import measurements
    news = measurements.size

    measurements =
      old_pairs.each_with_object([]).with_index do |((stream, measurements), acc), i|
        measurements.each do |measurement|
          acc <<
          Measurement.new(
            value: measurement.value,
            latitude: measurement.latitude,
            longitude: measurement.longitude,
            time: measurement.time_local,
            timezone_offset: nil,
            milliseconds: 0,
            measured_value: measurement.value,
            stream_id: persisted_streams_hash[[stream.latitude, stream.longitude, stream.sensor_name]].last
          )
        end
      end
    result = Measurement.import measurements
  end

  def user_id
    @user_id ||= @user.id
  end
end
