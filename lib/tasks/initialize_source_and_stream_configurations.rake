desc 'Initialize source and stream configurations'
task initialize_source_and_stream_configurations: :environment do
  Setup::SourceStreamConfigurationInitializer.new.call
end
