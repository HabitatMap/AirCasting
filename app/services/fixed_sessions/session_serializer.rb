module FixedSessions
  # Metadata + per-stream identity for a single fixed session, used by the list
  # (GET /api/v3/fixed_sessions). Never measurements — `last_measurement` is the
  # one reading a client needs to show a live tile, and history is read from the
  # stream endpoints.
  #
  # Where the mobile serializer reports per-stream aggregates, this one reports
  # none: a fixed session's streams all sit at the session's single location, and
  # the v3 fixed ingest writes to `fixed_measurements`, which updates neither
  # `streams.measurements_count` nor `streams.average_value`.
  #
  # `session_token` is deliberately absent — it authenticates the AirBeam's
  # uploads, and a list response is the wrong place to hand a credential back.
  #
  # No internal ids: v3 addresses a session by `uuid` and a stream by
  # `sensor_name`.
  #
  # Every timestamp is a real UTC instant in epoch milliseconds. `time_zone`
  # travels with the session so a client can render those instants as the local
  # time at the sensor; the `*_local` columns hold that local time naively, which
  # is a storage detail no client should have to know.
  class SessionSerializer
    # `latest_measurements` maps stream id to `{ value:, time: }`, resolved for a
    # whole page at once by the caller — see FixedSessions::List.
    def call(session, latest_measurements: {})
      {
        uuid: session.uuid,
        title: session.title,
        type: session.type,
        tag_list: tag_list(session),
        contribute: session.contribute,
        is_indoor: session.is_indoor,
        time_zone: session.time_zone,
        start_time: local_epoch_ms(session.start_time_local, session.time_zone),
        end_time: local_epoch_ms(session.end_time_local, session.time_zone),
        last_measurement_at: epoch_ms(session.last_measurement_at),
        finished_at: epoch_ms(session.finished_at),
        version: session.version,
        latitude: session.latitude,
        longitude: session.longitude,
        share_url: share_url(session),
        device: device(session.device),
        streams: streams(session, latest_measurements),
      }
    end

    private

    # Same output as `Session#tag_list`, but off the preloaded association.
    # acts-as-taggable-on builds a fresh scope in `tags_on`, discarding any
    # preload — two queries per session on the list endpoint.
    def tag_list(session)
      ActsAsTaggableOn::TagList.new(*session.tags.map(&:name)).to_s
    end

    # `*_local` columns hold sensor-local wall clock in a naive UTC column, so the
    # real instant is recovered through the session's zone.
    def local_epoch_ms(local_as_utc, time_zone)
      return nil unless local_as_utc

      Utils.from_local_as_utc(local_as_utc, time_zone).to_i * 1_000
    end

    # `last_measurement_at` and `finished_at` are both real instants, unlike the
    # `*_local` columns above, so neither needs a zone to interpret.
    def epoch_ms(timestamp)
      timestamp && timestamp.to_i * 1_000
    end

    # Capability link to the session — anyone holding it can view the session,
    # which is how a private (non-contributed) session gets shared. Served as a
    # full URL because the backend host is configurable (self-hosted installs).
    def share_url(session)
      Rails.application.routes.url_helpers.short_session_url(
        session,
        host: A9n.host_,
      )
    end

    def device(record)
      return nil unless record

      { mac_address: record.mac_address, model: record.model, name: record.name }
    end

    def streams(session, latest_measurements)
      session.streams.each_with_object({}) do |stream, acc|
        acc[stream.sensor_name] = {
          sensor_name: stream.sensor_name,
          sensor_type_id: stream.sensor_type_id,
          sensor_package_name: stream.sensor_package_name,
          measurement_type: stream.measurement_type,
          measurement_short_type: stream.measurement_short_type,
          unit_name: stream.unit_name,
          unit_symbol: stream.unit_symbol,
          last_measurement: last_measurement(latest_measurements[stream.id]),
          threshold_very_low: stream.threshold_set.threshold_very_low,
          threshold_low: stream.threshold_set.threshold_low,
          threshold_medium: stream.threshold_set.threshold_medium,
          threshold_high: stream.threshold_set.threshold_high,
          threshold_very_high: stream.threshold_set.threshold_very_high,
        }
      end
    end

    def last_measurement(record)
      return nil unless record

      { value: record[:value], time: epoch_ms(record[:time]) }
    end
  end
end
