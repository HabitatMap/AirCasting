module Explore
  # A stream's current value, joined one row per stream.
  #
  # The value is the stream's last hourly average, the number the web map pins
  # (streams.last_hourly_average_id, moved by the hourly cron). A stream with
  # no hourly average yet, i.e. under about an hour old, falls back to its
  # newest reading. Never streams.average_value: the v3 fixed ingest does not
  # update that column.
  #
  # The Limit stops the Append after its first row, so the fixed_measurements
  # branch only runs for a stream without an hourly average. That branch is a
  # top-1 probe of index_fixed_measurements_on_stream_id_and_time_with_time_zone;
  # a DISTINCT ON over the stream ids would read every row of every stream.
  # stream_hourly_averages.date_time is UTC without a zone and marks the end of
  # the hour it averages.
  #
  # `required:` is what the two readers disagree on. The map drops a stream
  # that has never reported — there is nothing to pin. The station detail keeps
  # it and sends `last_measurement: null`, because a configured stream missing
  # from the response reads as a bug rather than as silence.
  module CurrentValueJoin
    def self.sql(required:)
      <<~SQL
        LEFT JOIN stream_hourly_averages
          ON stream_hourly_averages.id = streams.last_hourly_average_id
        #{required ? 'JOIN' : 'LEFT JOIN'} LATERAL (
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
    end
  end
end
