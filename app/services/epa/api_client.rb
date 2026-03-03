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
      folder_path = measured_at.strftime('%Y/%Y%m%d')
      file_timestamp = measured_at.strftime('%Y%m%d%H')

      client.get(
        "/files.airnowtech.org/airnow/#{folder_path}/HourlyData_#{file_timestamp}.dat",
      )
    end

    private

    attr_reader :client
  end
end
