class AirNow::ImportMeasurements
  def initialize(
    locations_data: Http.new.get(locations_endpoint),
    hourly_data: Http.new.get(hourly_data_endpoint)
  )
    @locations_data = locations_data
    @hourly_data = hourly_data
    @save_measurements = SaveMeasurements.new(user: User.where(username: 'US EPA AirNow').first!)
    @parse_files = AirNow::ParseFiles
    @process_measurements = AirNow::ProcessMeasurements
  end

  def call
    locations = parse_files.parse_locations(locations_data)
    measurements = parse_files.parse_hourly_data(hourly_data, locations)
    saveable_measurements = process_measurements.new(measurements).call
    streams = GroupByStream.new.call(measurements: saveable_measurements)
    save_measurements.call(streams: streams)

    binding.pry
  end

  private

  attr_reader :locations_data, :hourly_data, :save_measurements, :parse_files, :process_measurements

  def locations_endpoint
    'https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/monitoring_site_locations.dat'
  end

  def hourly_data_endpoint
    current_utc = DateTime.now.new_offset(0) - 1.hour
    formatted_date = current_utc.strftime('%Y%m%d')
    formatted_hour = current_utc.strftime('%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/2024/#{formatted_date}/HourlyData_#{formatted_date}#{formatted_hour}.dat"
  end
end
