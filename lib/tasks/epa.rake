namespace :epa do
  desc 'Import EPA stations (creates station_streams)'
  task import_stations: :environment do
    Epa::Stations::Interactor.new.call
  end

  desc 'Run EPA measurements orchestration'
  task import_measurements: :environment do
    Epa::IngestOrchestrator.new.call
  end

  task migrate_data_to_station_streams: :environment do
    DataFixes::EpaDataMigrator.new.call
  end
end
