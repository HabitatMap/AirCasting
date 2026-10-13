namespace :epa do
  desc 'Import EPA stations (creates station_streams)'
  task import_stations: :environment do
    Epa::Stations::Interactor.new.call
  end

  desc 'Run EPA measurements orchestration'
  task import_measurements: :environment do
    Epa::IngestOrchestrator.new.call
  end

  desc 'Link EPA streams without a station via the site list of the day they ' \
         'last reported. Dry run; APPLY=1 writes, CACHE_DIR=path keeps the files'
  task link_stationless_streams: :environment do
    DataFixes::EpaStationlessStreamsLinker
      .new(cache_dir: ENV['CACHE_DIR'].presence)
      .call(apply: ENV['APPLY'] == '1')
  end

  desc 'Merge UNMATCHED EPA streams into the stream of the same station and ' \
         'type. Run after link_stationless_streams. Dry run; APPLY=1 writes, ' \
         'LIMIT=n caps the streams merged per run'
  task merge_unmatched_streams: :environment do
    DataFixes::EpaUnmatchedStreamsMerger.new.call(
      apply: ENV['APPLY'] == '1',
      limit: ENV['LIMIT'].presence&.to_i,
    )
  end

  desc 'Delete EPA streams with no station that were never measured. Run ' \
         'after merge_unmatched_streams. Dry run; APPLY=1 writes'
  task delete_never_measured_streams: :environment do
    DataFixes::EpaNeverMeasuredStreamsDeleter.new.call(
      apply: ENV['APPLY'] == '1',
    )
  end

  task migrate_data_to_station_streams: :environment do
    DataFixes::EpaDataMigrator.new.call
  end
end
