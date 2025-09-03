module DataFixes
  class FixedMeasurementsPopulator
    def initialize(logger: Logger.new('log/fixed_measurements_population.log'))
      @logger = logger
    end

    def call
      streams_count, measurements_count = check_streams_and_measurements_count
      logger.info 'Starting population process'
      logger.info "Number of streams to process: #{streams_count}, number of measurements to process: #{measurements_count}"

      Stream
        .joins(:session)
        .where(sessions: { type: 'FixedSession' })
        .in_batches do |batch|
          batch
            .pluck('streams.id', 'sessions.time_zone')
            .each do |stream_id, time_zone|
              insert_into_fixed_measurements(stream_id, time_zone)
            end
          logger.info "Batch completed, processed streams: #{batch.map(&:id).join(', ')} "
        end

      logger.info 'Finished population process'
    end

    private

    attr_reader :logger

    def check_streams_and_measurements_count
      sql = <<-SQL
      SELECT COUNT(*), SUM(measurements_count)
   FROM streams
   JOIN sessions ON streams.session_id = sessions.id
   WHERE sessions.type='FixedSession'
    SQL
      result = ActiveRecord::Base.connection.execute(sql).first

      [result['count'].to_i, result['sum'].to_i]
    end

    def insert_into_fixed_measurements(stream_id, time_zone)
      sql = <<-SQL
    INSERT INTO fixed_measurements (stream_id, value, time, created_at, updated_at, time_with_time_zone)
    SELECT
        stream_id,
        value,
        time,
        NOW() AS created_at,
        NOW() AS updated_at,
        time AT TIME ZONE '#{time_zone}' AS time_with_time_zone
    FROM
        measurements
    WHERE
        stream_id = #{stream_id}
    ON CONFLICT (stream_id, time_with_time_zone) DO NOTHING;
  SQL

      ActiveRecord::Base.connection.execute(sql)
    end
  end
end
