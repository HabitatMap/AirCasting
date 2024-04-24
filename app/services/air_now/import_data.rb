class AirNow::ImportData
  def initialize(http_client: Http.new)
    @http_client = http_client
  end

  def call
    locations_data = http_client.get(locations_endpoint)
    hourly_data = http_client.get(hourly_data_endpoint)

    [locations_data, hourly_data]
  end

  private

  attr_reader :http_client

  def locations_endpoint
    'https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/monitoring_site_locations.dat'
  end

  def hourly_data_endpoint
    current_utc = DateTime.now.new_offset(0) - 1.hour
    formatted_date = current_utc.strftime('%Y%m%d')
    formatted_hour = current_utc.strftime('%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/HourlyData_#{formatted_date}#{formatted_hour}.dat"
  end
end
