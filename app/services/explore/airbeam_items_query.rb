module Explore
  # Active, public, outdoor AirBeam fixed sessions in the bounds, one Item per
  # session with its selected streams.
  #
  # A stream's value is its last hourly average, the number the web map pins
  # (streams.last_hourly_average_id, moved by the hourly cron). A stream with
  # no hourly average yet, i.e. under about an hour old, falls back to its
  # newest reading. Never streams.average_value: the v3 fixed ingest does not
  # update that column.
  class AirbeamItemsQuery
    SOURCE = 'airbeam'.freeze

    # The legacy government ingest still writes FixedSessions under these
    # users; that data is served from stations instead.
    GOVERNMENT_USERNAMES =
      GovernmentSources::Repository::SOURCE_CONFIGS
        .values
        .map { |config| config[:username] }
        .freeze

    COLUMNS = %w[
      sessions.uuid
      sessions.title
      users.username
      sessions.latitude
      sessions.longitude
      streams.id
      stream_value.measured_at
      streams.sensor_name
      streams.unit_symbol
      stream_value.value
    ].freeze

    CURRENT_VALUE_JOIN = CurrentValueJoin.sql(required: true).freeze

    # What "public" means, shared with Explore::StationQuery so the two cannot
    # drift: a contributed, outdoor session that is not the legacy government
    # ingest wearing a user account. Liveness is deliberately not part of it —
    # the map adds `.active` below, the detail endpoint serves dormant and finished
    # sessions too.
    def self.public_scope
      FixedSession
        .joins(:user, :streams)
        .where(contribute: true, is_indoor: false)
        .where.not(users: { username: GOVERNMENT_USERNAMES })
    end

    def call(bounds:, parameters:, title: nil)
      return [] unless parameters.airbeam?

      rows = scope(bounds, parameters, title).pluck(*COLUMNS)

      rows
        .group_by(&:first)
        .map do |uuid, session_rows|
          _, session_title, username, latitude, longitude = session_rows.first

          Item.with_streams(
            source: SOURCE,
            uuid: uuid,
            title: session_title,
            provider: username,
            latitude: latitude.to_f,
            longitude: longitude.to_f,
            streams: session_rows.map { |row| stream(row, parameters) },
          )
        end
    end

    private

    # `active` is the map's own filter on top of the shared public scope:
    # last_measurement_at is the one indexed column here and shrinks the set
    # before the bounds, which sessions has no index for. is_indoor = false,
    # in public_scope, also drops NULL — an unknown we would rather not place
    # on a public map.
    def scope(bounds, parameters, title)
      query =
        self
          .class
          .public_scope
          .active
          .where(
            bounds.between_condition('sessions.latitude', 'sessions.longitude'),
          )
          .where(
            'LOWER(streams.sensor_name) IN (?)',
            parameters.airbeam_sensor_names,
          )
          .joins(CURRENT_VALUE_JOIN)

      return query if title.blank?

      query.where(
        'sessions.title ILIKE ?',
        "%#{ActiveRecord::Base.sanitize_sql_like(title)}%",
      )
    end

    def stream(row, parameters)
      _, _, _, _, _, id, last_measured_at, sensor_name, unit_symbol, value = row

      ItemStream.new(
        id: id,
        sensor_name: sensor_name,
        parameter: parameters.parameter_for_airbeam(sensor_name),
        unit_symbol: unit_symbol,
        last_value: value,
        last_measured_at: last_measured_at,
      )
    end
  end
end
