module MobileSessions
  # The signed-in user's own mobile sessions — metadata + per-stream aggregates,
  # NO measurements. Full authoritative set by default (so the client can treat a
  # locally-known session that is absent here as deleted); optional page/per_page
  # for the rare heavy account.
  class List
    def initialize(user:, page: nil, per_page: nil)
      @user = user
      @page = page
      @per_page = per_page
    end

    def call
      paginate(scope).map { |session| serialize(session) }
    end

    private

    attr_reader :user, :page, :per_page

    def scope
      user
        .mobile_sessions
        .includes(:device, :tags, streams: :threshold_set)
        .order(start_time_local: :desc)
    end

    def paginate(relation)
      return relation unless per_page

      relation.offset((page.to_i.nonzero? || 1).pred * per_page.to_i).limit(per_page.to_i)
    end

    def serialize(session)
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
        airbeam: airbeam(session.device),
        streams: streams(session),
      }
    end

    def airbeam(device)
      return nil unless device

      { mac_address: device.mac_address, model: device.model, name: device.name }
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
