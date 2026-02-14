desc 'Import EEA stations from CSV file (PM2.5, NO2, O3 for all countries)'
task import_eea_stations: :environment do
  puts 'Importing EEA stations...'
  Eea::Stations::Interactor.new.call
  puts 'Import completed'
end
