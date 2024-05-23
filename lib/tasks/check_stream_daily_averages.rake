namespace: daily_stream_averages do
  task check: :environment do
    FixedSession.find_each do |fixed_session|
      fixed_session.streams.find_each do |stream|
        start_time = stream.measurements.minimum(:time_with_time_zone).beginning_of_day
        end_time = stream.measurements.maximum(:time_with_time_zone).end_of_day

        (start_time.to_date..end_time.to_date).each do |date|
          daily_average_exists = DailyStreamAverage.exists?(stream_id: stream.id, date: date)

          unless daily_average_exists
            puts "Missing DailyStreamAverage for stream_id: #{stream.id} on date: #{date}"
          end
        end
      end
    end
  end
end
