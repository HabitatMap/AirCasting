module HourlyAverages
  class Repository
    def calculate_for_hour(measured_at:)
      hour_start = measured_at - 1.hour
      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, measured_at, hour_start, measured_at])
        INSERT INTO hourly_averages (
          station_stream_id,
          value,
          measured_at,
          created_at,
          updated_at
        )
        SELECT
          fm.station_stream_id,
          ROUND(AVG(fm.value)) AS value,
          ? AS measured_at,
          NOW() AS created_at,
          NOW() AS updated_at
        FROM fixed_measurements fm
        INNER JOIN station_streams ss ON ss.id = fm.station_stream_id
        INNER JOIN sources s ON s.id = ss.source_id
        WHERE s.name = 'EEA'
          AND fm.measured_at > ?
          AND fm.measured_at <= ?
        GROUP BY fm.station_stream_id
        ON CONFLICT (station_stream_id, measured_at)
        DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at;
      SQL

      ActiveRecord::Base.connection.execute(sql)
    end
  end
end
