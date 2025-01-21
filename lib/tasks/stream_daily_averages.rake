desc 'Remove stream daily averages data'
task remove_stream_daily_averages_data: :environment do
  StreamDailyAverage.delete_all
end

desc 'Recalculate stream daily average values'
task :recalculate_stream_daily_average_values,
     %i[start_date end_date] => :environment do |_, args|
  StreamDailyAverages::Calculator.new.call(
    start_date: args[:start_date],
    end_date: args[:end_date],
  )
end
