desc 'Migrate EPA data to fixed streams'
task migrate_epa_data: :environment do
  DataFixes::EpaDataMigrator.new.call
end
