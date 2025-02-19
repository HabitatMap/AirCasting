desc 'Populate fixed measurements'
task populate_fixed_measurements: :environment do
  DataFixes::FixedMeasurementsPopulator.new.call
end
