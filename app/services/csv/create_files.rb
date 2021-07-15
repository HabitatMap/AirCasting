require 'csv'

class Csv::CreateFiles
  def initialize(
    repository = Csv::Repository.new,
    create_measurements_csv_file = Csv::CreateMeasurementsFile.new,
    create_notes_csv_file = Csv::CreateNotesFile.new
  )
    @create_measurements_csv_file = create_measurements_csv_file
    @create_notes_csv_file = create_notes_csv_file
    @repository = repository
  end

  def call(session_ids)
    session_ids.flat_map do |session_id|
      csv_measurements_files_for(session_id)
    end + session_ids.flat_map { |session_id| csv_notes_files_for(session_id) }
  end

  private

  def csv_measurements_files_for(session_id)
    sensor_package_names = @repository.find_sensor_package_names(session_id)
    sensor_package_names.reduce([]) do |acc, sensor_package_name|
      reduce(acc, sensor_package_name, session_id)
    end
  end

  def csv_notes_files_for(session_id)
    notes = @repository.find_notes(session_id)

    return [] unless notes.any?
    session_title = @repository.find_session_title(session_id)

    @create_notes_csv_file.call(notes, session_title, session_id)
  end

  def reduce(acc, sensor_package_name, session_id)
    amount_of_streams =
      @repository.count_streams(session_id, sensor_package_name)
    return acc if amount_of_streams == 0

    stream_parameters =
      @repository.find_stream_parameters(session_id, sensor_package_name)
    measurements =
      @repository.find_measurements(session_id, sensor_package_name)
    return acc if measurements.size == 0

    data =
      build_measurements_data(
        amount_of_streams,
        measurements,
        sensor_package_name,
        session_id,
        stream_parameters
      )
    acc + [@create_measurements_csv_file.call(data)]
  end

  def build_measurements_data(
    amount_of_streams,
    measurements,
    sensor_package_name,
    session_id,
    stream_parameters
  )
    Csv::MeasurementsData.new(
      'amount_of_streams' => amount_of_streams,
      'measurements' => measurements,
      'sensor_package_name' => sensor_package_name,
      'session_id' => session_id,
      'stream_parameters' => stream_parameters
    )
  end
end

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

class Csv::CreateNotesFile
  def initialize(append_notes_content = Csv::AppendNotesContent.new)
    @append_notes_content = append_notes_content
  end

  def call(notes, session_title, session_id)
    session_title = session_title || ''
    filename =
      "notes_from_#{session_title.parameterize(separator: '_')}_#{session_id}__"
    file = Tempfile.new([filename, '.csv'])
    csv = CSV.generate { |csv| @append_notes_content.call(csv, notes) }
    file.write(csv)
    file.close
    file
  end
end
