class SaveMeasurements
  def initialize(user:)
    @user = user
  end

  def call(streams:)
    FixedSession.transaction { save(streams) }
  end

  private

  attr_reader :user

  def save(streams)
    persisted_streams =
      Stream
        .select(:id, :min_latitude, :min_longitude, :sensor_name, :session_id)
        .joins(:session)
        .where(session: { user_id: user.id })
        .load

    persisted_streams_hash =
      persisted_streams.each_with_object({}) do |stream, acc|
        acc[[stream.min_latitude.to_f, stream.min_longitude.to_f, stream.sensor_name]] = [
          stream.session_id,
          stream.id,
        ]
      end

    pairs_to_append, pairs_to_create =
      streams.to_a.partition do |stream, _measurements|
        persisted_streams_hash.key?(
          [stream.latitude, stream.longitude, stream.sensor_name],
        )
      end

    sessions_to_create =
      pairs_to_create.map do |stream, measurements|
        uuid = SecureRandom.uuid
        first = measurements.first
        last = measurements.last

        FixedSession.new(
          user_id: user.id,
          title: first.title,
          contribute: true,
          start_time_local: first.time_local,
          end_time_local: last.time_local,
          last_measurement_at: last.time_with_time_zone,
          is_indoor: false,
          latitude: stream.latitude,
          longitude: stream.longitude,
          uuid: uuid,
          url_token: uuid,
          time_zone: stream.time_zone,
        )
      end
    import = FixedSession.import sessions_to_create
    if import.failed_instances.any?
      Rails
        .logger.warn "FixedSession.import failed for: #{import.failed_instances.inspect}"
    end
    last_id = FixedSession.last.id

    # https://github.com/zdennis/activerecord-import/issues/422
    session_ids = ((last_id - sessions_to_create.size + 1)..last_id).to_a

    sessions_to_update =
      pairs_to_append.each_with_object({}) do |(stream, measurements), acc|
        session_id =
          persisted_streams_hash[
            [stream.latitude, stream.longitude, stream.sensor_name]
          ].first
        last = measurements.first
        acc[session_id] = {
          'id' => session_id,
          'end_time_local' => last.time_local,
          'last_measurement_at' => last.time_with_time_zone,
          'title' => last.title,
        }
      end
    to_import =
      FixedSession
        .where(id: sessions_to_update.keys)
        .map do |session|
          session
            .attributes
            .reject { |k, v| k == 'tag_list' }
            .merge(sessions_to_update.fetch(session.id))
        end
    import =
      FixedSession.import to_import,
                          on_duplicate_key_update: %i[
                            end_time_local
                            last_measurement_at
                            title
                          ]
    if import.failed_instances.any?
      Rails
        .logger.warn "FixedSession.import failed for: #{import.failed_instances.inspect}"
    end

    streams_to_update =
      pairs_to_append.each_with_object({}) do |(stream, measurements), acc|
        stream_id =
          persisted_streams_hash[
            [stream.latitude, stream.longitude, stream.sensor_name]
          ].last
        last = measurements.first
        acc[stream_id] = {
          'id' => stream_id,
          'average_value' => last.value,
          'measurements_count' => measurements.size,
        }
      end
    to_import =
      Stream
        .where(id: streams_to_update.keys)
        .map do |stream|
          to_merge = streams_to_update.fetch(stream.id)
          persisted = stream.attributes
          persisted
            .merge(to_merge)
            .merge(
              'measurements_count' =>
                to_merge.fetch('measurements_count') +
                  persisted.fetch('measurements_count'),
            )
        end
    import =
      Stream.import to_import,
                    on_duplicate_key_update: %i[
                      average_value
                      measurements_count
                    ]
    if import.failed_instances.any?
      Rails
        .logger.warn "Stream.import failed for: #{import.failed_instances.inspect}"
    end

    created_sessions = Session.where(id: session_ids)

    new_streams =
      pairs_to_create.map do |stream, measurements|
        session = created_sessions
          .where(latitude: stream.latitude, longitude: stream.longitude).first

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
          session_id: session.id,
          measurements_count: measurements.size,
          average_value: measurements.last.value,
        )
      end
    import = Stream.import new_streams
    if import.failed_instances.any?
      Rails
        .logger.warn "Stream.import failed for: #{import.failed_instances.inspect}"
    end
    last_id = Stream.last.id

    # https://github.com/zdennis/activerecord-import/issues/422
    stream_ids = ((last_id - new_streams.size + 1)..last_id).to_a
    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    measurements =
      pairs_to_create
        .each_with_object([])
        .with_index do |((stream, measurements), acc), i|

          measurements.each do |measurement|
            acc <<
              Measurement.new(
                value: measurement.value,
                latitude: measurement.latitude,
                longitude: measurement.longitude,
                location: factory.point(measurement.latitude.to_f, measurement.longitude.to_f),
                time: measurement.time_local,
                timezone_offset: nil,
                milliseconds: 0,
                measured_value: measurement.value,
                stream_id: stream_ids[i],
                time_with_time_zone: measurement.time_with_time_zone
              )
          end
        end
    import = Measurement.import measurements
    if import.failed_instances.any?
      Rails
        .logger.warn "Measurement.import failed for: #{import.failed_instances.inspect}"
    end

    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    measurements =
      pairs_to_append
        .each_with_object([])
        .with_index do |((stream, measurements), acc), i|
          measurements.each do |measurement|
            acc <<
              Measurement.new(
                value: measurement.value,
                latitude: measurement.latitude,
                longitude: measurement.longitude,
                location: factory.point(measurement.latitude.to_f, measurement.longitude.to_f),
                time: measurement.time_local,
                timezone_offset: nil,
                milliseconds: 0,
                measured_value: measurement.value,
                stream_id:
                  persisted_streams_hash[
                    [stream.latitude, stream.longitude, stream.sensor_name]
                  ].last,
                time_with_time_zone: measurement.time_with_time_zone
              )
          end
        end
    import = Measurement.import measurements
    if import.failed_instances.any?
      Rails
        .logger.warn "Measurement.import failed for: #{import.failed_instances.inspect}"
    end
  end
end
