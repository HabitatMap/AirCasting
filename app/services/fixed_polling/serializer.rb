module FixedPolling
  class Serializer
    def call(session:, tag_list:, measurements:)
      {
        id: session.id,
        type: session.type,
        uuid: session.uuid,
        title: session.title,
        tag_list: tag_list.join(' '),
        start_time: session.start_time_local.iso8601(3),
        end_time: session.end_time_local.iso8601(3),
        version: session.version,
        streams: serialized_streams(session, measurements),
      }
    end

    private

    def serialized_streams(session, measurements)
      latitude = session.latitude
      longitude = session.longitude

      session
        .streams
        .each_with_object({}) do |stream, hash|
          hash[stream.sensor_name.to_sym] =
            serialized_stream(
              stream,
              measurements[stream.id],
              latitude,
              longitude,
            )
        end
    end

    def serialized_stream(stream, stream_measurements, latitude, longitude)
      {
        id: stream.id,
        sensor_name: stream.sensor_name,
        sensor_package_name: stream.sensor_package_name,
        unit_name: stream.unit_name,
        measurement_type: stream.measurement_type,
        measurement_short_type: stream.measurement_short_type,
        unit_symbol: stream.unit_symbol,
        threshold_very_low: stream.threshold_set.threshold_very_low,
        threshold_low: stream.threshold_set.threshold_low,
        threshold_medium: stream.threshold_set.threshold_medium,
        threshold_high: stream.threshold_set.threshold_high,
        threshold_very_high: stream.threshold_set.threshold_very_high,
        measurements:
          serialized_measurements(stream_measurements, latitude, longitude),
      }
    end

    def serialized_measurements(measurements, latitude, longitude)
      Array(measurements).map do |measurement|
        {
          id: measurement.id,
          stream_id: measurement.stream_id,
          value: measurement.value,
          time: measurement.time.utc.iso8601(3),
          latitude: latitude,
          longitude: longitude,
          milliseconds: 0,
        }
      end
    end
  end
end
