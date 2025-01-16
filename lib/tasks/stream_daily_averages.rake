desc 'Update stream daily average values'
task update_stream_daily_average_values: :environment do
  StreamDailyAverages::FixedActiveSessionsTraverser.new.call
end

desc 'Remove stream daily averages data'
task remove_stream_daily_averages_data: :environment do
  StreamDailyAverage.delete_all
end
