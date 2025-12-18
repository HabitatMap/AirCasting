desc 'Assign stream to EEA fixed streams'
task assign_stream_to_eea_fixed_streams: :environment do
  DataFixes::StreamForFixedStreamAssigner.new.call
end
