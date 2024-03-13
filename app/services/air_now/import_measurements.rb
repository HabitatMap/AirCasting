class AirNow::ImportMeasurements
  def call
    locations_data = AirNow::DownloadFiles.new(locations_endpoint).fetch
    hourly_data = AirNow::DownloadFiles.new(hourly_data_endpoint).fetch
    locations = AirNow::ParseFiles.parse_locations(locations_data)
    measurements = AirNow::ParseFiles.parse_hourly_data(hourly_data, locations)
    filtered_measurements = AirNow::FilterMeasurements.new(measurements).call
    normalized_measurements = AirNow::NormalizeMeasurements.new(filtered_measurements).call
    saveable_measurements = AirNow::CreateSaveableObjects.new(normalized_measurements).call
    streams = GroupByStream.new.call(measurements: saveable_measurements)
    SaveMeasurements.new(user: User.where(username: 'AirNow').first!).call(streams: streams)
  end

  private

  def locations_endpoint
    'https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/monitoring_site_locations.dat'
  end

  def hourly_data_endpoint
    # change the substracted hours after testing to a correct value depending on when it will be fired
    current_utc = DateTime.now.new_offset(0) - 1.hour
    formatted_date = current_utc.strftime('%Y%m%d')
    formatted_hour = current_utc.strftime('%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/2024/#{formatted_date}/HourlyData_#{formatted_date}#{formatted_hour}.dat"
  end
end
