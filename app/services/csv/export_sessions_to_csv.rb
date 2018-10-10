require "zip"

class Csv::ExportSessionsToCsv
  def initialize(create_csv_files = Csv::CreateFiles.new, create_zip_file = Csv::CreateZipFile.new)
    @create_csv_files = create_csv_files
    @create_zip_file = create_zip_file
    @csv_files = []
    filename = "sessions_#{Time.current.to_formatted_s(:number)}"
    @zip_file = Tempfile.new([ filename, ".zip" ])
  end

  def call(session_ids)
    @csv_files = @create_csv_files.call(session_ids)
    @create_zip_file.call(@zip_file, @csv_files)
    @zip_file.path
  end

  def clean
    @csv_files.map(&:close!)
    @zip_file.close!
  end
end

class Csv::CreateZipFile
  def call(zip_file, csv_files)
    Zip::File.open(zip_file.path, Zip::File::CREATE) do |zip|
      csv_files.each { |file| zip.add(File.basename(file.path), file.path) }
    end
  end
end
