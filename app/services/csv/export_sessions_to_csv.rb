require 'zip'

class Csv::ExportSessionsToCsv
  def initialize(
    create_csv_files = Csv::CreateFiles.new,
    create_zip_file = Csv::CreateZipFile.new
  )
    @create_csv_files = create_csv_files
    @create_zip_file = create_zip_file
    @files_to_zip = [Tempfile.new('.keep')] # the zip file needs to contain at least one file, otherwise it cannot be opened
    filename = "sessions_#{Time.current.to_formatted_s(:number)}"
    @zip_file = Tempfile.new([filename, '.zip'])
  end

  def call(session_ids)
    @files_to_zip += @create_csv_files.call(session_ids)
    @create_zip_file.call(@zip_file, @files_to_zip)
    @zip_file.path
  end

  def clean
    @files_to_zip.map(&:close!)
    @zip_file.close!
  end
end

class Csv::CreateZipFile
  def call(zip_file, files_to_zip)
    Zip::File.open(zip_file.path, Zip::File::CREATE) do |zip|
      files_to_zip.each { |file| zip.add(File.basename(file.path), file.path) }
    end
  end
end
