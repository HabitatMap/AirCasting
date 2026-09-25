module MobileSessions
  # Shared metadata + per-stream aggregate shape for a single mobile session.
  # Used by the list (GET /api/v3/mobile_sessions), show
  # (GET /api/v3/mobile_sessions/:uuid) and update (PATCH /:uuid) endpoints so
  # they return identical shapes. Aggregates only — never measurements.
  #
  # `include_notes` is off for the list, which is a whole-account summary, and on
  # for show/update. Notes are also their own resource
  # (/mobile_sessions/:uuid/notes) — embedded here so opening a session is one
  # request, listed there so a client can refresh them without refetching the
  # stream metadata.
  #
  # No internal ids: v3 addresses a session by `uuid` and a stream by
  # `sensor_name`.
  #
  # Every timestamp this API group puts on the wire is a real UTC instant in
  # epoch milliseconds — the same domain as the epochs the binary upload carries
  # and as the measurements read endpoint. `time_zone` travels with the session
  # so a client can render those instants as the local time the session was
  # recorded in; the columns themselves hold that local time naively, which is a
  # storage detail no client should have to know.
  class SessionSerializer
    def call(session, include_notes: false)
      result = {
        uuid: session.uuid,
        title: session.title,
        type: session.type,
        tag_list: tag_list(session),
        contribute: session.contribute,
        time_zone: session.time_zone,
        start_time: local_epoch_ms(session.start_time_local, session.time_zone),
        end_time: local_epoch_ms(session.end_time_local, session.time_zone),
        finished_at: epoch_ms(session.finished_at),
        version: session.version,
        latitude: session.latitude,
        longitude: session.longitude,
        share_url: share_url(session),
        device: device(session.device),
        streams: streams(session),
      }

      result[:notes] = notes(session) if include_notes
      result
    end

    private

    # One implementation, shared with the note endpoints: the same record
    # serialised two ways would drift, and the note `id` has to appear in both
    # or a client reading a session cannot then address its notes. Notes keep an
    # id where sessions and streams do not, because they have no natural key —
    # `number` is reused after a delete on both apps.
    #
    # `with_attached_s3_photo` or the serializer asks the attachments table once
    # per note, and the blobs table again for each one that has a photo.
    def notes(session)
      ::Notes::Serializer.new.call_many(session.notes.with_attached_s3_photo)
    end

    # Same output as `Session#tag_list`, but off the preloaded association.
    # acts-as-taggable-on builds a fresh scope in `tags_on`, discarding any
    # preload — two queries per session on the list endpoint.
    def tag_list(session)
      ActsAsTaggableOn::TagList.new(*session.tags.map(&:name)).to_s
    end

    # `*_local` columns hold session-local wall clock in a naive UTC column, so
    # the real instant is recovered through the session's zone. Null until the
    # first measurements land.
    def local_epoch_ms(local_as_utc, time_zone)
      return nil unless local_as_utc

      Utils.from_local_as_utc(local_as_utc, time_zone).to_i * 1_000
    end

    # `finished_at` is a timestamptz — already a real instant, unlike the
    # `*_local` columns above, so it needs no zone to interpret. Null until the
    # user declares the recording over.
    def epoch_ms(timestamp)
      timestamp && timestamp.to_i * 1_000
    end

    # Capability link to the session — anyone holding it can view the session,
    # which is how a private (non-contributed) session gets shared. Served as a
    # full URL because the backend host is configurable (self-hosted installs);
    # the app appends `?sensor_name=<stream>` before sharing.
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

    def streams(session)
      session.streams.each_with_object({}) do |stream, acc|
        acc[stream.sensor_name] = {
          sensor_name: stream.sensor_name,
          sensor_type_id: stream.sensor_type_id,
          sensor_package_name: stream.sensor_package_name,
          measurement_type: stream.measurement_type,
          measurement_short_type: stream.measurement_short_type,
          unit_name: stream.unit_name,
          unit_symbol: stream.unit_symbol,
          measurements_count: stream.measurements_count,
          average_value: stream.average_value,
          min_latitude: stream.min_latitude,
          max_latitude: stream.max_latitude,
          min_longitude: stream.min_longitude,
          max_longitude: stream.max_longitude,
          start_latitude: stream.start_latitude,
          start_longitude: stream.start_longitude,
          threshold_very_low: stream.threshold_set.threshold_very_low,
          threshold_low: stream.threshold_set.threshold_low,
          threshold_medium: stream.threshold_set.threshold_medium,
          threshold_high: stream.threshold_set.threshold_high,
          threshold_very_high: stream.threshold_set.threshold_very_high,
        }
      end
    end
  end
end
