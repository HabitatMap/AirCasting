namespace :measurements do
  task populate_time_with_time_zone: :environment do
    batch_size = 50_000
    sleep_time = 0.5
    total_processed = 0
    last_maintenance_at = 0
    maintenance_interval = 200_000_000

    total_to_update = Measurement.where(time_with_time_zone: nil).count
    puts "Total measurements to update: #{total_to_update}"

    ActiveRecord::Base.connection.execute("SELECT DISTINCT session_id FROM session_timezones").each do |row|
      session_id = row['session_id']
      timezone_info = ActiveRecord::Base.connection.execute("SELECT timezone_name FROM session_timezones WHERE session_id = #{session_id}")
      next if timezone_info.count.zero?

      timezone_name = timezone_info.first['timezone_name']

      Measurement.where(stream_id: Stream.select(:id).where(session_id: session_id), time_with_time_zone: nil).find_in_batches(batch_size: batch_size) do |batch|
        measurement_ids = batch.map(&:id)

        unless measurement_ids.empty?
          sql = <<-SQL
            UPDATE measurements
            SET time_with_time_zone = time at time zone '#{timezone_name}'
            WHERE id IN (#{measurement_ids.join(',')})
          SQL

          ActiveRecord::Base.connection.execute(sql)
        end

        total_processed += batch.size
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
    end

    puts "Finished populating time_with_time_zone for measurements."
  end
end
