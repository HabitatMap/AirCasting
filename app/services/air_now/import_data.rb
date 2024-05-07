class AirNow::ImportData
  def initialize(http_client: Http.new)
    @http_client = http_client
  end

  def call
    current_utc = DateTime.now.new_offset(0).beginning_of_hour - 1.hour

    hourly_data = []

    (current_utc - 24.hours).step(current_utc, 1/24.0).each do |utc_time|
      hourly_data << http_client.get(hourly_data_endpoint(utc_time))
    end

    locations_data = http_client.get(locations_endpoint)

    [locations_data, hourly_data]
  end

  private

  attr_reader :http_client

  def locations_endpoint
    'https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/monitoring_site_locations.dat'
  end

  def hourly_data_endpoint(utc_time)
    formatted_date = utc_time.strftime('%Y%m%d')
    formatted_hour = utc_time.strftime('%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/HourlyData_#{formatted_date}#{formatted_hour}.dat"
  end
end
