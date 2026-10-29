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

    # One row per stream. The Limit stops the Append after its first row, so
    # the fixed_measurements branch only runs for a stream without an hourly
    # average. That branch is a top-1 probe of
    # index_fixed_measurements_on_stream_id_and_time_with_time_zone; a
    # DISTINCT ON over the stream ids would read every row of every stream.
    # A stream with neither has never reported and drops out.
    # stream_hourly_averages.date_time is UTC without a zone and marks the end
    # of the hour it averages.
    CURRENT_VALUE_JOIN = <<~SQL.freeze
      LEFT JOIN stream_hourly_averages
        ON stream_hourly_averages.id = streams.last_hourly_average_id
      JOIN LATERAL (
        (
          SELECT stream_hourly_averages.value::float8 AS value,
                 stream_hourly_averages.date_time AT TIME ZONE 'UTC' AS measured_at
          WHERE stream_hourly_averages.id IS NOT NULL
        )
        UNION ALL
        (
          SELECT value, time_with_time_zone
          FROM fixed_measurements
          WHERE fixed_measurements.stream_id = streams.id
          ORDER BY time_with_time_zone DESC
          LIMIT 1
        )
        LIMIT 1
      ) stream_value ON true
    SQL

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

    # `active` first: last_measurement_at is the one indexed column here and
    # shrinks the set before the bounds, which sessions has no index for.
    # is_indoor = false also drops NULL, an unknown we would rather not place
    # on a public map.
    def scope(bounds, parameters, title)
      query =
        FixedSession
          .active
          .joins(:user, :streams)
          .where(contribute: true, is_indoor: false)
          .where.not(users: { username: GOVERNMENT_USERNAMES })
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
