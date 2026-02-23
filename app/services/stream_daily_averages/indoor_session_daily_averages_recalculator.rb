module StreamDailyAverages
  class IndoorSessionDailyAveragesRecalculator
    BATCH_SIZE = 500
    SLEEP_BETWEEN_BATCHES = 0.5

    def initialize(batch_size: BATCH_SIZE, sleep_between_batches: SLEEP_BETWEEN_BATCHES)
      @batch_size = batch_size
      @sleep_between_batches = sleep_between_batches
    end

    def call
      indoor_stream_ids.each_slice(batch_size) do |batch_ids|
        upsert_daily_averages(batch_ids)
        sleep(sleep_between_batches)
      end
    end

    private

    attr_reader :batch_size, :sleep_between_batches

    def indoor_stream_ids
      Stream
        .joins(:session)
        .where(sessions: { type: 'FixedSession', is_indoor: true })
        .pluck(:id)
    end

    def upsert_daily_averages(stream_ids)
      quoted_ids = stream_ids.join(', ')

      # The day interval is open at the start and closed at the end:
      # (00:00:00 of day D, 00:00:00 of day D+1]
      # A measurement at exactly 00:00:00 belongs to the previous day.
      # We achieve this by subtracting 1 microsecond before truncating to the day.
      sql = <<~SQL
        INSERT INTO stream_daily_averages (stream_id, value, date, created_at, updated_at)
        SELECT
          stream_id,
          ROUND(AVG(value))::integer AS value,
          DATE_TRUNC('day', time_with_time_zone - INTERVAL '1 microsecond')::date AS date,
          NOW() AS created_at,
          NOW() AS updated_at
        FROM fixed_measurements
        WHERE stream_id IN (#{quoted_ids})
        GROUP BY stream_id, date
        ON CONFLICT (stream_id, date) DO UPDATE
          SET value = EXCLUDED.value, updated_at = NOW();
      SQL

      ActiveRecord::Base.transaction { ActiveRecord::Base.connection.execute(sql) }
    end
  end
end
