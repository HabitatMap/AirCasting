desc 'Update stream daily average values'
task update_stream_daily_average_values: :environment do
  StreamDailyAverages::FixedActiveSessionsTraverser.new.call
end
