# this is a rake task to create default thresholds for sensors that have more than 1000 occurrences - defaults created based on previous logic
# (it's only a proposal, not a final solution)
namespace :default_thresholds do
  task create: :environment do
    puts "Starting to create default thresholds"

    frequent_pairs = Stream
                      .select("sensor_name, unit_symbol, COUNT(*) as count")
                      .group(:sensor_name, :unit_symbol)
                      .having('COUNT(*) >= 1000')
                      .order('count DESC')

    frequent_pairs.each do |stream|
      puts "Sensor: #{stream.sensor_name}, Unit: #{stream.unit_symbol} has #{stream.count} occurrences."

      thresholds = Stream.thresholds(stream.sensor_name, stream.unit_symbol)

      DefaultThreshold.create!(
        sensor_name: stream.sensor_name,
        unit_symbol: stream.unit_symbol,
        threshold_very_low: thresholds[0],
        threshold_low: thresholds[1],
        threshold_medium: thresholds[2],
        threshold_high: thresholds[3],
        threshold_very_high: thresholds[4],
      )
    end
  end
end
