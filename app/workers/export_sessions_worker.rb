class ExportSessionsWorker
  include Sidekiq::Worker
  sidekiq_options queue: :default

  def perform(session_ids, email)
    service = Csv::ExportSessionsToCsv.new

    begin
      zip_path = service.call(session_ids)
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
