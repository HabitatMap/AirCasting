require "csv"

class Csv::CreateFiles
  def initialize(repository = Csv::Repository.new, create_csv_file = Csv::CreateFile.new)
    @create_csv_file = create_csv_file
    @repository = repository
  end

  def call(session_ids)
    session_ids.flat_map { |session_id| csv_files_for(session_id) }
  end

  private

  def csv_files_for(session_id)
    sensor_package_names = @repository.find_sensor_package_names(session_id)
    sensor_package_names.reduce([]) { |acc, sensor_package_name| reduce(acc, sensor_package_name, session_id) }
  end

  def reduce(acc, sensor_package_name, session_id)
    amount_of_streams = @repository.count_streams(session_id, sensor_package_name)
    return acc if amount_of_streams == 0

    stream_parameters = @repository.find_stream_parameters(session_id, sensor_package_name)
    measurements = @repository.find_measurements(session_id, sensor_package_name)
    data = build_data(amount_of_streams, measurements, sensor_package_name, session_id, stream_parameters)
    acc + [@create_csv_file.call(data)]
  end

  def build_data(amount_of_streams, measurements, sensor_package_name, session_id, stream_parameters)
    Csv::Data.new(
      "amount_of_streams" => amount_of_streams,
      "measurements" => measurements,
      "sensor_package_name" => sensor_package_name,
      "session_id" => session_id,
      "stream_parameters" => stream_parameters
    )
  end
end

class Csv::CreateFile
  def initialize(append_content = Csv::AppendContent.new)
    @append_content = append_content
  end

  def call(data)
    session_title = data.measurements.first["session_title"] || ""
    filename = "#{session_title.parameterize('_')}_#{data.session_id}__"
    file = Tempfile.new([filename, ".csv"])
    csv = CSV.generate { |csv| @append_content.call(csv, data) }
    file.write(csv)
    file.close
    file
  end
end
