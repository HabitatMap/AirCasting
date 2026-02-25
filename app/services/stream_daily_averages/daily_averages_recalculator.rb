module StreamDailyAverages
  class DailyAveragesRecalculator
    BATCH_SIZE = 500
    SLEEP_BETWEEN_BATCHES = 0.5

    def initialize(batch_size: BATCH_SIZE, sleep_between_batches: SLEEP_BETWEEN_BATCHES)
      @batch_size = batch_size
      @sleep_between_batches = sleep_between_batches
    end

    def call(stream_ids:)
      stream_ids.each_slice(batch_size) do |batch_ids|
        upsert_daily_averages(batch_ids)
        sleep(sleep_between_batches)
      end
    end

    private

    attr_reader :batch_size, :sleep_between_batches

    def upsert_daily_averages(stream_ids)
      quoted_ids = stream_ids.join(', ')

      # Uses the `time` column (local device time, no timezone) — same bucketing as Calculator.
      # The day interval is open at the start and closed at the end:
      # day D = (00:00:00 of D, 00:00:00 of D+1]
      # A measurement at exactly 00:00:00 belongs to the previous day.
      # CASE WHEN time >= 00:00:01 → same day; ELSE → previous day
      # (equivalent to: DATE_TRUNC('day', time - INTERVAL '1 second'))
      sql = <<~SQL
        WITH daily AS (
          SELECT
            stream_id,
            CASE
              WHEN time::time >= '00:00:01' THEN DATE_TRUNC('day', time)::date
              ELSE (DATE_TRUNC('day', time) - INTERVAL '1 day')::date
            END AS date,
            AVG(value) AS avg_value
          FROM fixed_measurements
          WHERE stream_id IN (#{quoted_ids})
          GROUP BY stream_id, date
        )
        INSERT INTO stream_daily_averages (stream_id, value, date, created_at, updated_at)
        SELECT stream_id, ROUND(avg_value)::integer, date, NOW(), NOW()
        FROM daily
        ON CONFLICT (stream_id, date) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW();
      SQL

      ActiveRecord::Base.transaction { ActiveRecord::Base.connection.execute(sql) }
    end
  end
end
