module Explore
  # One station in full, where Explore::MapSerializer is the same station
  # reduced to a map pin.
  #
  # It stays a superset of the map's `station` item, same field names and same
  # types, so a client can decode one into the other. What it adds is what one
  # station needs and a pin does not: the device, a share link, whether the
  # station is still reporting, and each stream's update rate and 24-hour
  # range.
  #
  # Values are rounded to whole numbers as the map draws them. Timestamps are
  # real UTC instants in epoch milliseconds, like the rest of the v3 mobile API.
  class StationSerializer
    def call(item)
      json = {
        uuid: item.uuid,
        source: item.source,
        title: item.title,
        provider: item.provider,
        latitude: item.latitude,
        longitude: item.longitude,
        device_model: item.device_model,
        share_url: item.share_url,
        is_active: item.is_active,
        streams: item.streams.map { |stream| stream(stream) },
      }

      # Absent rather than null when there is no link: a station stored before
      # `stations.url_token` existed and not yet backfilled. There is nothing
      # for a client to fall back to, and an absent key says that where a null
      # would invite a retry.
      item.share_url ? json : json.except(:share_url)
    end

    private

    def stream(stream)
      {
        stream_id: stream.id,
        sensor_name: stream.sensor_name,
        measurement_type: stream.parameter,
        unit_symbol: stream.unit_symbol,
        update_frequency: stream.update_frequency,
        last_measurement: last_measurement(stream),
        last_24h: last_24h(stream),
      }
    end

    # Null when the stream has never reported. The map drops such a stream
    # instead; the detail lists it, because a configured stream missing from the
    # response reads as a bug rather than as silence.
    def last_measurement(stream)
      return nil if stream.last_value.nil? || stream.last_measured_at.nil?

      { value: stream.last_value.round, time: stream.last_measured_at.to_i * 1_000 }
    end

    # Null when the stream reported nothing in the last 24 hours — the normal
    # state of a dormant station, which is still served.
    def last_24h(stream)
      return nil if stream.min_24h.nil?

      { min: stream.min_24h.round, max: stream.max_24h.round }
    end
  end
end
