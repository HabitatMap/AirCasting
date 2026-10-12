module Epa
  class ApiClient
    BASE_URL = 'https://s3-us-west-1.amazonaws.com/'

    def initialize(client: ::ApiClient.new(base_url: BASE_URL))
      @client = client
    end

    # V2, not v1: only V2 carries the FullAQSID that groups streams into
    # stations, and the MonitorType that marks temporary monitors.
    def fetch_locations
      client.get(
        '/files.airnowtech.org/airnow/today/Monitoring_Site_Locations_V2.dat',
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
