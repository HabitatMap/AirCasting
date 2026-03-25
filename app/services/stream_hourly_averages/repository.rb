module StreamHourlyAverages
  class Repository
    def insert_stream_hourly_averages(start_date_time:, end_date_time:)
      stream_ids_and_values_to_insert =
        hourly_average_values_for_fixed_streams(start_date_time, end_date_time)

      if stream_ids_and_values_to_insert.any?
        insert_records(stream_ids_and_values_to_insert, end_date_time)
      end
    end

    def upsert_hourly_averages_for_stream(stream_id:, start_date_time:, end_date_time:)
      conn = StreamHourlyAverage.connection
      conn.execute(<<~SQL.squish)
        INSERT INTO stream_hourly_averages (stream_id, date_time, value, created_at, updated_at)
        SELECT
          #{conn.quote(stream_id)},
          CASE
            WHEN time_with_time_zone = DATE_TRUNC('hour', time_with_time_zone)
              THEN time_with_time_zone
            ELSE DATE_TRUNC('hour', time_with_time_zone) + INTERVAL '1 hour'
          END AS date_time,
          ROUND(AVG(value)::numeric)::integer AS value,
          NOW(),
          NOW()
        FROM fixed_measurements
        WHERE stream_id = #{conn.quote(stream_id)}
          AND time_with_time_zone > #{conn.quote(start_date_time.iso8601)}::timestamptz
          AND time_with_time_zone <= #{conn.quote(end_date_time.iso8601)}::timestamptz
        GROUP BY date_time
        ON CONFLICT (stream_id, date_time) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW()
      SQL
    end

    def update_streams_last_hourly_average_ids(date_time:)
      stream_ids_with_last_hourly_average_ids =
        StreamHourlyAverage
          .where(date_time: date_time)
          .pluck(:stream_id, :id)
          .to_h

      streams = Stream.where(id: stream_ids_with_last_hourly_average_ids.keys)

      streams.each do |stream|
        stream.update(
          last_hourly_average_id:
            stream_ids_with_last_hourly_average_ids[stream.id],
        )
      end
    end

    def streams_averages_last_7_days(stream_ids:)
      return [] if stream_ids.empty?

      # date_time in stream_hourly_averages stores the END of the hour bucket
      # (e.g., 12:00 for measurements from 11:01-12:00), so we use
      # beginning_of_hour with <= to include the latest complete bucket.
      end_date = Time.current.beginning_of_hour
      start_date = end_date - 7.days

      conn = ActiveRecord::Base.connection
      quoted_ids = stream_ids.map { |id| conn.quote(id) }.join(', ')

      conn
        .execute(<<~SQL.squish)
          SELECT TO_CHAR(date_time, 'YYYY-MM-DD HH24:MI:SS +0000') AS hour,
                 ROUND(AVG(value::numeric))::float AS average_value
          FROM stream_hourly_averages
          WHERE stream_id IN (#{quoted_ids})
            AND date_time >= #{conn.quote(start_date)}
            AND date_time <= #{conn.quote(end_date)}
          GROUP BY date_time
          ORDER BY date_time
        SQL
        .map { |record| { time: record['hour'], value: record['average_value'] } }
    end

    private

    def hourly_average_values_for_fixed_streams(start_date_time, end_date_time)
      # That's a temporary solution until we have stream_configuration in place to store information about sensor type.
      # AirNow uses the legacy sessions model but has its own pipeline — excluded to avoid duplication.
      # EEA uses the new FixedStream model and stores hourly averages in the separate hourly_averages table — excluded here.
      excluded_user_ids =
        User.where(username: ['US EPA AirNow', 'EEA']).pluck(:id)

      FixedMeasurement
        .joins(stream: :session)
        .where(
          'time_with_time_zone > ? AND time_with_time_zone <= ?',
          start_date_time,
          end_date_time,
        )
        .where.not(sessions: { user_id: excluded_user_ids })
        .group(:stream_id)
        .average(:value)
        .map { |stream_id, value| { stream_id: stream_id, value: value.round } }
    end

    def insert_records(stream_ids_and_values_to_insert, end_date_time)
      current_time = Time.current

      StreamHourlyAverage
        .create_with(
          date_time: end_date_time,
          created_at: current_time,
          updated_at: current_time,
        )
        .insert_all(
          stream_ids_and_values_to_insert,
          unique_by: %i[stream_id date_time],
        )
    end
  end
end
