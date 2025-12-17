desc 'Import EEA sampling points from CSV files'
task import_eea_sampling_points: :environment do
  Eea::SamplingPoints::Interactor.new.call
end
