require 'zip'

class Csv::CreateZipFile
  def call(zip_file, files_to_zip)
    Zip::File.open(zip_file.path, Zip::File::CREATE) do |zip|
      files_to_zip.each { |file| zip.add(File.basename(file.path), file.path) }
    end
  end
end
