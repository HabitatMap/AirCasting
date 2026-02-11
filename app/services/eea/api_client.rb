module Eea
  class ApiClient
    BASE_URL = 'https://eeadmz1-downloads-api-appservice.azurewebsites.net'
    HEADERS = { 'Accept' => '*/*', 'Content-Type' => 'application/json' }

    def initialize(client: ::ApiClient.new(base_url: BASE_URL, headers: HEADERS))
      @client = client
    end

    def fetch_zip_bytes(
      country:,
      pollutant:,
      window_starts_at:,
      window_ends_at:
    )
      client.post(
        '/ParquetFile',
        body:
          {
            countries: [country],
            pollutants: [pollutant],
            dateTimeStart: window_starts_at,
            dateTimeEnd: window_ends_at,
          }.merge(default_params).to_json,
      )
    end

    private

    attr_reader :client

    def default_params
      { cities: [], dataset: 1, aggregationType: 'hour' }
    end
  end
end
