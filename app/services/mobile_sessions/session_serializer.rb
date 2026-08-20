module MobileSessions
  # Shared metadata + per-stream aggregate shape for a single mobile session.
  # Used by both the list (GET /api/v3/mobile_sessions) and show
  # (GET /api/v3/mobile_sessions/:uuid) endpoints so they return identical shapes.
  # Aggregates only — never measurements.
  class SessionSerializer
    def call(session)
      {
        id: session.id,
        uuid: session.uuid,
        title: session.title,
        type: session.type,
        tag_list: session.tag_list.to_s,
        contribute: session.contribute,
        start_time_local: session.start_time_local,
        end_time_local: session.end_time_local,
        version: session.version,
        latitude: session.latitude,
        longitude: session.longitude,
        share_url: share_url(session),
        device: device(session.device),
        streams: streams(session),
      }
    end

    private

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
          id: stream.id,
          sensor_name: stream.sensor_name,
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
          threshold_very_low: stream.threshold_set&.threshold_very_low,
          threshold_low: stream.threshold_set&.threshold_low,
          threshold_medium: stream.threshold_set&.threshold_medium,
          threshold_high: stream.threshold_set&.threshold_high,
          threshold_very_high: stream.threshold_set&.threshold_very_high,
        }
      end
    end
  end
end
