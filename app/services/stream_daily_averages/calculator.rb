module StreamDailyAverages
  class Calculator
    def call(start_date:, end_date:)
      start_date_time = Time.parse(start_date)
      end_date_time = Time.parse(end_date) + 1.day

      Rails.logger.info(
        "STARTING: Recalculating averages from #{start_date_time} to #{end_date_time}",
      )

      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(
          query(start_date_time, end_date_time),
        )
      end

      Rails.logger.info(
        "FINISHED: Averages recalculated from #{start_date_time} to #{end_date_time}",
      )
    end

    private

    def query(start_date_time, end_date_time)
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
      JOIN streams ON measurements.stream_id = streams.id
      JOIN sessions ON streams.session_id = sessions.id
      WHERE time > '#{start_date_time}'
      AND time <= '#{end_date_time}'
      AND sessions.last_measurement_at >= '#{start_date_time - 2.days}'
      AND sessions.type = 'FixedSession'
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
