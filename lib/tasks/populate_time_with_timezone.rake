namespace :measurements do
  task populate_time_with_time_zone: :environment do
    batch_size = 50_000
    sleep_time = 0.5
    total_processed = 0
    last_maintenance_at = 0
    maintenance_interval = 50_000_000

    stream_ids_to_update = Measurement.where(time_with_time_zone: nil).select(:stream_id).distinct
    session_ids_to_update = Stream.where(id: stream_ids_to_update).select(:session_id).distinct.pluck(:session_id)
    total_to_update = Measurement.where(time_with_time_zone: nil).count
    puts "Total measurements to update: #{total_to_update}"

    Session.where(id: session_ids_to_update).find_each(batch_size: 100) do |session|
      time_zone_name = session.time_zone
      next if time_zone_name.blank?

      Measurement.where(stream_id: Stream.select(:id).where(session_id: session.id), time_with_time_zone: nil).find_in_batches(batch_size: batch_size) do |batch|
        measurement_ids = batch.map(&:id)

        unless measurement_ids.empty?
          sql = <<-SQL
            UPDATE measurements
            SET time_with_time_zone = time at time zone '#{time_zone_name}'
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
