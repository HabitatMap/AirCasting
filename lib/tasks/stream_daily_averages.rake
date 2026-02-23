desc 'Remove stream daily averages data'
task remove_stream_daily_averages_data: :environment do
  StreamDailyAverage.delete_all
end

desc 'Recalculate stream daily average values'
task recalculate_stream_daily_average_values: :environment do
  StreamDailyAverages::Calculator.new.call
end

desc 'Fix daily averages for indoor sessions that may have been calculated incorrectly due to timezone offset'
task fix_indoor_session_daily_averages: :environment do
  puts 'Fixing daily averages for indoor sessions...'
  StreamDailyAverages::IndoorSessionDailyAveragesRecalculator.new.call
  puts 'Done.'
end
