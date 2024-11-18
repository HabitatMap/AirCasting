desc 'Assign stream ids to threshold alerts'
task assign_stream_ids_to_threshold_alerts: :environment do
  streams_repository = StreamsRepository.new

  ThresholdAlert.find_each do |alert|
    stream =
      streams_repository.find_by_session_uuid_and_sensor_name(
        session_uuid: alert.session_uuid,
        sensor_name: alert.sensor_name,
      )
    if stream.present?
      puts "Updating alert #{alert.id} with stream #{stream.id}"
      alert.update!(stream_id: stream.id)
    else
      puts "Alert #{alert.id} has no stream"
      alert.destroy
    end
  end
end
