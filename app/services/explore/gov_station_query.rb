module Explore
  class GovStationQuery
    SOURCE = GovItemsQuery::SOURCE
    UPDATE_FREQUENCY = '1 hour'.freeze

    COLUMNS = {
      uuid: 'stations.uuid',
      title: 'stations.title',
      url_token: 'stations.url_token',
      time_zone: 'stations.time_zone',
      provider: Arel.sql('COALESCE(sources.full_name, sources.name)'),
      latitude: Arel.sql('ST_Y(stations.location)'),
      longitude: Arel.sql('ST_X(stations.location)'),
      stream_id: 'station_streams.id',
      measurement_type: 'stream_configurations.measurement_type',
      unit_symbol: 'stream_configurations.unit_symbol',
      last_measured_at: 'station_streams.last_measured_at',
      last_value: 'station_measurements.value',
    }.freeze

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

    def scope(uuid)
      StationStream
        .joins(:station, :stream_configuration)
        .joins('JOIN sources ON sources.id = stations.source_id')
        .joins(
          'LEFT JOIN station_measurements
             ON station_measurements.station_stream_id = station_streams.id
            AND station_measurements.measured_at = station_streams.last_measured_at',
        )
        .merge(Station.shown)
        .where(stations: { uuid: uuid }, stream_configurations: { canonical: true })
    end

    def build(rows)
      station = rows.first
      ranges = last_24h_query.government(rows.map { |row| row[:stream_id] })
      last_measured_at = rows.filter_map { |row| row[:last_measured_at] }.max

      Item.new(
        source: SOURCE,
        uuid: station[:uuid],
        title: station[:title],
        provider: station[:provider],
        latitude: station[:latitude],
        longitude: station[:longitude],
        time_zone: station[:time_zone],
        device_model: nil,
        share_url: share_url(station[:url_token]),
        is_active: active?(last_measured_at),
        last_measured_at: last_measured_at,
        streams: StreamOrder.call(rows.map { |row| stream(row, ranges) }),
      )
    end

    # Nil for a station stored before `stations.url_token` existed and not yet
    # backfilled, which the serializer turns into an absent key rather than a
    # link that cannot resolve.
    def share_url(url_token)
      return nil if url_token.blank?

      Rails.application.routes.url_helpers.short_station_url(
        url_token,
        host: A9n.host_,
      )
    end

    # StationStream#is_active, over the station's newest stream.
    def active?(last_measured_at)
      last_measured_at.present? &&
        last_measured_at > StationStream::ACTIVE_FOR.ago
    end

    def stream(row, ranges)
      range = ranges[row[:stream_id]]
      measurement_type = row[:measurement_type]

      ItemStream.new(
        id: row[:stream_id],
        sensor_name: "Government-#{measurement_type}",
        parameter: Parameters.government_key(measurement_type),
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
