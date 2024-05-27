namespace :stream_daily_averages do
  task check: :environment do
    count = FixedSession.count
    index = 0
    missing_averages = 0

    FixedSession.find_each do |fixed_session|
      fixed_session.streams.find_each do |stream|
        measurement_dates = stream.measurements.pluck(:time_with_time_zone).map(&:to_date).uniq

        measurement_dates.each do |date|
          daily_average_exists = StreamDailyAverage.exists?(stream_id: stream.id, date: date)

          unless daily_average_exists
            puts "Missing DailyStreamAverage for stream_id: #{stream.id} on date: #{date}"
            missing_averages += 1
          end
        end
      end
      puts "Processed #{index += 1} of #{count} sessions (#{(index.to_f / count * 100).round(2)}%)"
      puts "Found #{missing_averages} missing daily averages"
    end
    puts "Finished checking daily averages"
    puts "Found #{missing_averages} missing daily averages"
  end
end
