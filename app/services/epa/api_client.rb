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
      utc = measured_at.utc
      folder = utc.strftime('%Y/%Y%m%d')
      formatted_date = utc.strftime('%Y%m%d%H')

      client.get(
        "/files.airnowtech.org/airnow/#{folder}/HourlyData_#{formatted_date}.dat",
      )
    end

    private

    attr_reader :client
  end
end
