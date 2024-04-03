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

    Session.select('streams.id, sessions.time_zone')
      .distinct
      .joins(streams: :measurements)
      .where(measurements: { time_with_time_zone:  nil }) do |session|

        time_zone_name = session.time_zone
        next if time_zone_name.blank?

        Measurement.where(stream_id: Stream.select(:id).where(session_id: session.id), time_with_time_zone: nil).find_in_batches(batch_size: batch_size) do |batch|
          measurement_ids = batch.map(&:id)

        session.streams.each do |stream|
          sql = <<-SQL
            UPDATE measurements
            SET time_with_time_zone = time AT TIME ZONE '#{time_zone_name}'
            WHERE stream_id = '#{stream.id}' AND time_with_time_zone IS NULL
            RETURNING id
          SQL

          updated_rows = ActiveRecord::Base.connection.execute(sql)

          total_processed += updated_rows.to_a.size
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
