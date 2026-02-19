desc 'Setup sources and stream configurations'
task setup_sources_and_stream_configurations: :environment do
  GovernmentSources::SourceAndStreamConfigurationSetup.new.call
end
