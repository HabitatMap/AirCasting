module StreamDailyAverages
  class Calculator
    def call
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(query)
      end
    end

    private

    def query
      <<-SQL
      CREATE TEMP TABLE temp_daily_averages AS
      SELECT
        stream_id,
        ROUND(AVG(value)) AS value,
        CASE
          WHEN time::time >= '00:00:01' THEN DATE_TRUNC('day', time)
          ELSE DATE_TRUNC('day', time) - INTERVAL '1 day'
        END AS date
      FROM measurements
      WHERE time >= '2024-01-01 00:00:01'
      GROUP BY stream_id, date;

      INSERT INTO stream_daily_averages (stream_id, value, date, created_at, updated_at)
      SELECT
        stream_id,
        value,
        date,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM temp_daily_averages
      ON CONFLICT (stream_id, date) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW();

      DROP TABLE temp_daily_averages;
      SQL
    end
  end
end
