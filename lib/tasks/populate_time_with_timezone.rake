namespace :measurements do
  task populate_time_with_time_zone: :environment do
    sleep_time = 0.5
    total_processed = 0
    last_maintenance_at = 0
    maintenance_interval = 50_000_000

    total_to_update_sql = <<-SQL
      SELECT COUNT(*) FROM measurements WHERE time_with_time_zone IS NULL
    SQL

    total_to_update = ActiveRecord::Base.connection.execute(total_to_update_sql).first['count'].to_i
    puts "Total measurements to update: #{total_to_update}"

    Stream
      .distinct
      .joins(:session, :measurements)
      .where(measurements: {time_with_time_zone: nil})
      .pluck('streams.id, sessions.time_zone, streams.measurements_count')
      .each do |stream_id, time_zone_name, measurements_count|

      sql = <<-SQL
        UPDATE measurements
        SET time_with_time_zone = time AT TIME ZONE '#{time_zone_name}'
        WHERE stream_id = '#{stream_id}' AND time_with_time_zone IS NULL
      SQL

      ActiveRecord::Base.connection.execute(sql)

      total_processed += measurements_count
      progress_percentage = (total_processed.to_f / total_to_update * 100).round(2)
      puts "Processed #{total_processed} measurements so far (#{progress_percentage}% of total to update)."

      sleep(sleep_time)

      if total_processed - last_maintenance_at >= maintenance_interval
        puts "Performing database maintenance (VACUUM ANALYZE measurements)..."
        ActiveRecord::Base.connection.execute("VACUUM ANALYZE measurements")
        puts "Database maintenance completed."
        last_maintenance_at = total_processed
      end
    end


    puts "Finished populating time_with_time_zone for measurements."
  end
end
