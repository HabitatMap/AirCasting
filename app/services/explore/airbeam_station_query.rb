module Explore
  # One public AirBeam fixed session by uuid, with every stream it has.
  #
  # Two deliberate differences from AirbeamItemsQuery, which feeds the map:
  #
  #   * no liveness filter. A user who favourited a session wants to open it
  #     after it goes quiet — temporarily or for good — so dormant and finished
  #     sessions answer here while the map drops both.
  #   * no parameter filter, and no catalogue. Every stream of the session is
  #     returned, including PM1 and PM10, which the filter chips do not name;
  #     `measurement_type` is the column the rest of the API already exposes
  #     rather than a catalogue key.
  #
  # The public predicates themselves are not re-stated — they come from
  # AirbeamItemsQuery.public_scope so the detail and the map cannot disagree on
  # what is public.
  class AirbeamStationQuery
    SOURCE = AirbeamItemsQuery::SOURCE
    UPDATE_FREQUENCY = '1 minute'.freeze

    COLUMNS = {
      uuid: 'sessions.uuid',
      title: 'sessions.title',
      username: 'users.username',
      latitude: 'sessions.latitude',
      longitude: 'sessions.longitude',
      time_zone: 'sessions.time_zone',
      url_token: 'sessions.url_token',
      finished_at: 'sessions.finished_at',
      last_measurement_at: 'sessions.last_measurement_at',
      device_model: 'devices.model',
      stream_id: 'streams.id',
      sensor_name: 'streams.sensor_name',
      measurement_type: 'streams.measurement_type',
      unit_symbol: 'streams.unit_symbol',
      sensor_package_name: 'streams.sensor_package_name',
      last_measured_at: 'stream_value.measured_at',
      last_value: 'stream_value.value',
    }.freeze

    CURRENT_VALUE_JOIN = CurrentValueJoin.sql(required: false).freeze

    def initialize(last_24h_query: Last24hQuery.new)
      @last_24h_query = last_24h_query
    end

    def call(uuid:)
      rows = scope(uuid).pluck(*COLUMNS.values).map { |row| COLUMNS.keys.zip(row).to_h }
      return nil if rows.empty?

      build(rows)
    end

    private

    attr_reader :last_24h_query

    # LOWER(uuid) matches index_sessions_on_lower_uuid, the unique one — the
    # plain index_sessions_on_uuid is not, and a uuid was historically stored
    # in whatever case the client sent. `left_joins(:device)`: sessions.device_id
    # is recent wiring and null on most rows.
    def scope(uuid)
      AirbeamItemsQuery
        .public_scope
        .left_joins(:device)
        .where('LOWER(sessions.uuid) = ?', uuid.to_s.downcase)
        .joins(CURRENT_VALUE_JOIN)
    end

    def build(rows)
      session = rows.first
      ranges = last_24h_query.airbeam(rows.map { |row| row[:stream_id] })

      StationItem.new(
        source: SOURCE,
        uuid: session[:uuid],
        title: session[:title],
        provider: session[:username],
        latitude: session[:latitude].to_f,
        longitude: session[:longitude].to_f,
        time_zone: session[:time_zone],
        device_model: device_model(rows),
        share_url: share_url(session[:url_token]),
        is_active: active?(session),
        last_measured_at: session[:last_measurement_at],
        streams: StreamOrder.call(rows.map { |row| stream(row, ranges) }),
      )
    end

    def device_model(rows)
      DeviceModel.call(
        device_model: rows.first[:device_model],
        streams: rows.map { |row| [row[:sensor_package_name], row[:sensor_name]] },
      )
    end

    # The same capability link FixedSessions::SessionSerializer sends, so a
    # client shares a session it found on the map exactly as it shares its own.
    # Session#to_param is url_token, so the token alone is the route's id.
    def share_url(url_token)
      Rails.application.routes.url_helpers.short_session_url(
        url_token,
        host: A9n.host_,
      )
    end

    # FixedSession.active, read off the two columns already plucked rather than
    # re-queried: declared intent first, then silence.
    def active?(session)
      session[:finished_at].nil? && session[:last_measurement_at].present? &&
        session[:last_measurement_at] > FixedSession::ACTIVE_FOR.ago
    end

    def stream(row, ranges)
      range = ranges[row[:stream_id]]

      StreamItemRich.new(
        id: row[:stream_id],
        sensor_name: row[:sensor_name],
        parameter: row[:measurement_type],
        unit_symbol: row[:unit_symbol],
        last_value: row[:last_value],
        last_measured_at: row[:last_measured_at],
        update_frequency: UPDATE_FREQUENCY,
        min_24h: range && range[:min],
        max_24h: range && range[:max],
      )
    end
  end
end
