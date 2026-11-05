module Explore
  # The streams of one public station, by uuid, with no reading attached.
  #
  # Same lookup as Explore::StationQuery — government first, AirBeam second,
  # the same public predicates, the same uuid-format guard — but it stops at
  # naming the streams. It exists so
  # GET /api/v3/explore/stations/{uuid}/measurements can tell three cases
  # apart: no such public station (404 "Station not found"), a station without
  # the named stream (404 naming the stream), and a stream to read.
  #
  # Returns nil for the first case rather than an empty array, so "not public"
  # and "no streams configured" cannot be confused by a caller.
  class StationStreamsQuery
    UUID_FORMAT = StationQuery::UUID_FORMAT

    # nil when no public item of either source has this uuid.
    def call(uuid:)
      government(uuid) || airbeam(uuid)
    end

    private

    # `stations.uuid` is a typed uuid column, so Postgres raises on a malformed
    # literal instead of answering no rows — skip the probe entirely.
    def government(uuid)
      return nil unless UUID_FORMAT.match?(uuid.to_s)

      rows =
        StationStream
          .joins(:station, :stream_configuration)
          .merge(Station.shown)
          .where(stations: { uuid: uuid }, stream_configurations: { canonical: true })
          .pluck(
            'station_streams.id',
            'stream_configurations.measurement_type',
            'station_streams.last_measured_at',
          )
      return nil if rows.empty?

      rows.map do |id, measurement_type, last_measured_at|
        StreamItem.new(
          source: GovStationQuery::SOURCE,
          id: id,
          sensor_name: GovStationQuery.sensor_name(measurement_type),
          last_measured_at: last_measured_at,
        )
      end
    end

    # LOWER(uuid) matches index_sessions_on_lower_uuid, the unique one — see
    # Explore::AirbeamStationQuery#scope. `last_measurement_at` is session-wide
    # rather than per stream, which is the same anchor the fixed-session
    # endpoint uses (its `end_time_local`): an AirBeam's streams report together.
    def airbeam(uuid)
      rows =
        AirbeamItemsQuery
          .public_scope
          .where('LOWER(sessions.uuid) = ?', uuid.to_s.downcase)
          .pluck('streams.id', 'streams.sensor_name', 'sessions.last_measurement_at')
      return nil if rows.empty?

      rows.map do |id, sensor_name, last_measurement_at|
        StreamItem.new(
          source: AirbeamItemsQuery::SOURCE,
          id: id,
          sensor_name: sensor_name,
          last_measured_at: last_measurement_at,
        )
      end
    end
  end
end
