class AirNow::ImportMeasurements
  def call
    locations_data = Http.new.get(locations_endpoint)
    hourly_data = Http.new.get(hourly_data_endpoint)
    locations = AirNow::ParseFiles.parse_locations(locations_data)
    measurements = AirNow::ParseFiles.parse_hourly_data(hourly_data, locations)
    saveable_measurements = AirNow::ProcessMeasurements.new(measurements).call
    streams = GroupByStream.new.call(measurements: saveable_measurements)
    SaveMeasurements.new(user: User.where(username: 'US EPA AirNow').first!).call(streams: streams)
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
