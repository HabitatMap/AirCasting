namespace :stream_daily_averages do
  task populate: :environment do
    puts "Starting to populate daily stream averages"

    FixedSession.find_each(batch_size: 100) do |session|
      streams = session.streams

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
        end
      end
    end
  end
end
