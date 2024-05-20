namespace :stream_daily_averages do
  task populate: :environment do
    puts "Starting to populate daily stream averages"

    session_count = FixedSession.count
    current_session = 0

    FixedSession.find_each(batch_size: 100) do |session|
      puts "Processing session #{current_session += 1} of #{session_count} ( #{(current_session.to_f / session_count * 100).round(2)}%)"
      current_session += 1
      streams = session.streams

      averages_created = 0

      streams.each do |stream|
        measurements = stream.measurements.order(:time_with_time_zone)
        measurements.group_by { |m| m.time_with_time_zone.to_date }.each do |date, daily_measurements|
          daily_average = daily_measurements.map(&:value).sum.to_f / daily_measurements.size
          StreamDailyAverage.find_or_create_by(
            stream_id: stream.id,
            date: date
          ) do |stream_daily_average|
            stream_daily_average.value = daily_average
          end
          averages_created += 1
        end
      end
      puts "Created/found #{averages_created} daily averages for session #{session.id}"
    end
  end
end
