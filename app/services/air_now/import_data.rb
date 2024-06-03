class AirNow::ImportData
  def initialize(http_client: Http.new)
    @http_client = http_client
  end

  def call
    current_utc = Time.current.beginning_of_hour - 1.hour

    hourly_data = []

    2.times do |hour_offset|
      hourly_data <<
        http_client.get(hourly_data_endpoint(current_utc - hour_offset.hours))
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
    formatted_time = utc_time.strftime('%Y%m%d%H')
    "https://s3-us-west-1.amazonaws.com//files.airnowtech.org/airnow/today/HourlyData_#{formatted_time}.dat"
  end
end
