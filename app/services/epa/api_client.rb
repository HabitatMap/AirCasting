module Epa
  class ApiClient
    BASE_URL = 'https://s3-us-west-1.amazonaws.com/'

    def initialize(client: ::ApiClient.new(base_url: BASE_URL))
      @client = client
    end

    def fetch_locations
      client.get(
        '/files.airnowtech.org/airnow/today/monitoring_site_locations.dat',
      )
    end

    def fetch_hourly_data(measured_at:)
      formatted_date = measured_at.strftime('%Y%m%d%H')

      client.get(
        "/files.airnowtech.org/airnow/today/HourlyData_#{formatted_date}.dat",
      )
    end

    private

    attr_reader :client
  end
end
