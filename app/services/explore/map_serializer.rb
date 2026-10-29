module Explore
  # Only what the map draws: a pin with its card, or a cluster. An item carries
  # one entry per selected stream, each with its own `last_measurement`; a
  # cluster's `value` is present only when exactly one measurement type is
  # selected. Values are rounded to whole numbers as the web map shows them.
  # Timestamps are real UTC instants in epoch milliseconds, like the rest of the
  # v3 mobile API.
  class MapSerializer
    def call(markers)
      {
        items:
          markers.map do |marker|
            marker.is_a?(Cluster) ? cluster(marker) : item(marker)
          end,
      }
    end

    private

    def item(item)
      {
        type: 'station',
        uuid: item.uuid,
        source: item.source,
        title: item.title,
        provider: item.provider,
        latitude: item.latitude,
        longitude: item.longitude,
        streams: item.streams.map { |item_stream| stream(item_stream) },
      }
    end

    # `last_measurement` is shaped as FixedSessions::SessionSerializer sends it,
    # so a client decodes both endpoints' streams with one type. Its `value` is
    # a whole number here, as the map draws it, where the session list sends the
    # raw reading.
    #
    # Both queries join their stream's latest reading, so a stream without one
    # never reaches here and `last_measurement` is never null.
    def stream(stream)
      {
        stream_id: stream.id,
        sensor_name: stream.sensor_name,
        measurement_type: stream.parameter,
        unit_symbol: stream.unit_symbol,
        last_measurement: {
          value: stream.last_value.round,
          time: stream.last_measured_at.to_i * 1_000,
        },
      }
    end

    def cluster(cluster)
      json = {
        type: 'cluster',
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        count: cluster.count,
      }

      cluster.value.nil? ? json : json.merge(value: cluster.value.round)
    end
  end
end
