desc 'Remove stream daily averages data'
task remove_stream_daily_averages_data: :environment do
  StreamDailyAverage.delete_all
end

desc 'Recalculate stream daily average values'
task recalculate_stream_daily_average_values: :environment do
  StreamDailyAverages::Calculator.new.call
end

desc 'Fix daily averages for indoor sessions that may have been calculated incorrectly due to timezone offset'
task fix_indoor_session_daily_averages: :environment do
  BATCH_SIZE = 500
  SLEEP_BETWEEN_BATCHES = 0.5

  indoor_stream_ids =
    Stream
      .joins(:session)
      .where(sessions: { type: 'FixedSession', is_indoor: true })
      .pluck(:id)

  total_streams = indoor_stream_ids.count
  total_batches = (total_streams.to_f / BATCH_SIZE).ceil

  puts "Fixing daily averages for #{total_streams} indoor streams in #{total_batches} batches of #{BATCH_SIZE}..."

  indoor_stream_ids.each_slice(BATCH_SIZE).with_index(1) do |batch_ids, batch_num|
    puts "Processing batch #{batch_num}/#{total_batches}..."

    quoted_ids = batch_ids.join(', ')

    sql = <<~SQL
      INSERT INTO stream_daily_averages (stream_id, value, date, created_at, updated_at)
      SELECT
        stream_id,
        ROUND(AVG(value))::integer AS value,
        DATE_TRUNC('day', time_with_time_zone)::date AS date,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM fixed_measurements
      WHERE stream_id IN (#{quoted_ids})
      GROUP BY stream_id, date
      ON CONFLICT (stream_id, date) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW();
    SQL

    ActiveRecord::Base.transaction do
      ActiveRecord::Base.connection.execute(sql)
    end

    sleep(SLEEP_BETWEEN_BATCHES)
  end

  puts 'Done.'
end
