require 'zip'
class SessionsExporter
  def initialize(sessions)
    @sessions = sessions
    @zip_file = Tempfile.new(filename)
    @csv_files = []
  end

  def export
    @csv_files = create_temp_csv_files_from_sessions(@sessions)
    data = zip_files(@zip_file, @csv_files)

    data
  end

  def mime_type
    Mime::ZIP
  end

  def filename
    timestamp = Time.now.to_formatted_s(:number)
    "sessions_#{timestamp}.zip"
  end

  def clean
    @zip_file.unlink
    @csv_files.each(&:unlink)
  end

  private

  def create_temp_csv_files_from_sessions(sessions)
    sessions.map do |session|
      csv_content = SessionExporter.new(session).export

      file = Tempfile.new("session_#{session.id}_#{session.title.parameterize}_")
      file.write(csv_content)
      file.close

      file
    end
  end

  def zip_files(zip_file, files)
    Zip::OutputStream.open(zip_file) { |zos| }
    Zip::File.open(zip_file.path, Zip::File::CREATE) do |zip|
      files.each do |file|
        filename_in_archive = File.basename(file.path)

        zip.add("#{filename_in_archive}.csv", file.path)
      end
    end
    File.read(zip_file.path)
  end

end
