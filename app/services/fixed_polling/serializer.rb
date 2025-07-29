module FixedPolling
  class Serializer
    def call(session:, tag_list:, measurements:)
      {
        type: session.type,
        uuid: session.uuid,
        title: session.title,
        tag_list: tag_list.join(' '),
        start_time: session.start_time_local.iso8601(3),
        end_time: session.end_time_local.iso8601(3),
        version: session.version,
        streams: serialized_streams(session.streams, measurements),
      }
    end

    private

    def serialized_streams(streams, measurements)
      streams.each_with_object({}) do |stream, hash|
        hash[stream.sensor_name.to_sym] =
          serialize_stream(stream, measurements[stream.id])
      end
    end

    def serialize_stream(stream, stream_measurements)
      {
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
        measurements: serialize_measurements(stream_measurements),
      }
    end

    def serialize_measurements(measurements)
      Array(measurements).map do |measurement|
        {
          value: measurement.value,
          latitude: measurement.latitude.to_f,
          longitude: measurement.longitude.to_f,
          time: measurement.time.utc.iso8601(3),
        }
      end
    end
  end
end
