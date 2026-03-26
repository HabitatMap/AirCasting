class Csv::ExportStationStreamsToCsv
  def initialize(
    repository = Csv::StationStreamRepository.new,
    create_measurements_file = Csv::CreateMeasurementsFile.new,
    create_zip_file = Csv::CreateZipFile.new
  )
    @repository = repository
    @create_measurements_file = create_measurements_file
    @create_zip_file = create_zip_file
    filename = "sessions_#{Time.current.to_formatted_s(:number)}"
    @zip_file = Tempfile.new([filename, '.zip'])
    @files_to_zip = [Tempfile.new('.keep')]
  end

  def call(station_stream_ids)
    station_stream_ids.each do |station_stream_id|
      measurements = @repository.find_measurements(station_stream_id)
      next unless measurements.any?

      stream_parameters = @repository.find_stream_parameters(station_stream_id)
      sensor_package_name = @repository.find_sensor_package_name(station_stream_id)

      data =
        Csv::MeasurementsData.new(
          'amount_of_streams' => 1,
          'measurements' => measurements,
          'sensor_package_name' => sensor_package_name,
          'session_id' => station_stream_id,
          'stream_parameters' => stream_parameters,
        )

      @files_to_zip << @create_measurements_file.call(data)
    end

    @create_zip_file.call(@zip_file, @files_to_zip)
    @zip_file.path
  end

  def clean
    @files_to_zip.map(&:close!)
    @zip_file.close!
  end
end
