namespace :stream_hourly_averages do
  desc <<~DESC
    Backfill stream_hourly_averages for the past 7 days.

    Iterates over each completed hour in the window [now-7days, now) and runs
    the same insert + last_hourly_average_id update that the hourly cron
    (UpdateStreamHourlyAveragesWorker) performs, but for every past hour at once.

    Safe to run on a live system: insert_all uses ON CONFLICT DO NOTHING so
    existing rows are left untouched. Existing rows are intentionally not
    overwritten — use stream_hourly_averages:recalculate_last_7_days if you
    need to force-recompute values.

    Usage:
      bundle exec rake stream_hourly_averages:backfill_last_7_days
  DESC
  task backfill_last_7_days: :environment do
    repository = StreamHourlyAverages::Repository.new

    # Build the list of completed hour buckets: (now-7d, now], step 1h.
    # end_date_time is always beginning_of_hour so the current in-progress
    # hour is excluded (no complete data yet).
    end_date_time   = Time.current.beginning_of_hour
    start_date_time = end_date_time - 7.days

    total_hours = ((end_date_time - start_date_time) / 1.hour).to_i
    puts "Backfilling stream hourly averages for #{total_hours} hours " \
         "(#{start_date_time.utc} → #{end_date_time.utc})"

    processed = 0
    bucket_end = start_date_time + 1.hour

    while bucket_end <= end_date_time
      bucket_start = bucket_end - 1.hour

      ActiveRecord::Base.transaction do
        repository.insert_stream_hourly_averages(
          start_date_time: bucket_start,
          end_date_time: bucket_end,
        )
        repository.update_streams_last_hourly_average_ids(date_time: bucket_end)
      end

      processed += 1
      print "\r  #{processed}/#{total_hours} hours processed"
      $stdout.flush

      bucket_end += 1.hour
    end

    puts "\nDone."
  end
end
