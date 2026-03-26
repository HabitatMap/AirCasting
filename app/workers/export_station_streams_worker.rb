class ExportStationStreamsWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(station_stream_ids, email)
    service = Csv::ExportStationStreamsToCsv.new

    begin
      zip_path = service.call(station_stream_ids)
      zip_file = File.read(zip_path)
      zip_filename = File.basename(zip_path)

      UserMailer
        .with(email: email, zip_file: zip_file, zip_filename: zip_filename)
        .export_sessions
        .deliver_later
    ensure
      service.clean
    end
  end
end
