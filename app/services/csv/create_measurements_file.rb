require 'csv'

class Csv::CreateMeasurementsFile
  def initialize(
    append_measurements_content = Csv::AppendMeasurementsContent.new
  )
    @append_measurements_content = append_measurements_content
  end

  def call(data)
    session_title = data.measurements.first['session_title'] || ''
    filename =
      "#{session_title.parameterize(separator: '_')}_#{data.session_id}__"
    file = Tempfile.new([filename, '.csv'])
    csv = CSV.generate { |csv| @append_measurements_content.call(csv, data) }
    file.write(csv)
    file.close
    file
  end
end
