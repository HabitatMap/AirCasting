namespace :eea do
  desc 'Recalculate daily averages for station streams'
  task recalculate_daily_averages: :environment do
    DataFixes::StationStreamDailyAveragesRecalculator.new.call(
      source_name: :eea,
    )
  end
end
