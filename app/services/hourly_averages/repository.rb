module HourlyAverages
  class Repository
    def recalculate_for_time_range(starts_at:, ends_at:)
      start_hour = starts_at.beginning_of_hour
      end_hour = [ends_at.beginning_of_hour, Time.current.beginning_of_hour].min

      return if start_hour >= end_hour

      sql = ActiveRecord::Base.send(:sanitize_sql_array, [<<~SQL, start_hour, end_hour])
        INSERT INTO hourly_averages (
          fixed_stream_id,
          value,
          measured_at,
          created_at,
          updated_at
        )
        SELECT
          fm.fixed_stream_id,
          ROUND(AVG(fm.value)) AS value,
          DATE_TRUNC('hour', fm.measured_at) + INTERVAL '1 hour' AS measured_at,
          NOW() AS created_at,
          NOW() AS updated_at
        FROM fixed_measurements fm
        WHERE fm.measured_at >= ?
          AND fm.measured_at < ?
        GROUP BY fm.fixed_stream_id, DATE_TRUNC('hour', fm.measured_at)
        ON CONFLICT (fixed_stream_id, measured_at)
        DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at;
      SQL

      ActiveRecord::Base.connection.execute(sql)
    end
  end
end
