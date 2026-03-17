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
  stream_ids =
    Stream
      .joins(:session)
      .where(sessions: { type: 'FixedSession', is_indoor: true })
      .pluck(:id)
  puts 'Fixing daily averages for indoor sessions...'
  StreamDailyAverages::DailyAveragesRecalculator.new.call(stream_ids: stream_ids)
  puts 'Done.'
end

desc '[DEPRECATED] Fix daily averages for Gov fixed sessions (old data model, streams stored in Stream/FixedMeasurements)'
task fix_gov_fixed_session_daily_averages: :environment do
  gov_usernames = ["US EPA AirNow", "EEA"]
  stream_ids =
    Stream
      .joins(session: :user)
      .where(sessions: { type: 'FixedSession' })
      .where(users: { username: gov_usernames })
      .pluck(:id)
  puts "Fixing daily averages for #{stream_ids.size} Gov fixed session streams..."
  StreamDailyAverages::DailyAveragesRecalculator.new.call(stream_ids: stream_ids)
  puts 'Done.'
end
