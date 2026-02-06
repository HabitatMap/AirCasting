desc 'Import EEA sampling points from CSV file (PM2.5, NO2, O3 for all countries)'
task import_eea_sampling_points: :environment do
  puts 'Importing EEA sampling points...'
  Eea::SamplingPoints::Interactor.new.call
  puts 'Import completed'
end
