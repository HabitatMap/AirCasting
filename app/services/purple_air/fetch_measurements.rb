module PurpleAir
  class FetchMeasurements
    URL = 'https://api.purpleair.com/v1/sensors'
    HEADERS = { 'X-API-Key' => A9n.purple_air_api_key }
    LOCATION_TYPE_OUTSIDE = 0
    BASE_QUERY = {
      max_age: 10.minutes,
      location_type: LOCATION_TYPE_OUTSIDE,
    }

    def initialize(ordered_fields:)
      @fields = ordered_fields
    end

    def call
      response = HTTParty.get(URL, query: query, headers: HEADERS)
      JSON.parse(response.body).fetch('data')
    end

    private

    def query
      {
        **BASE_QUERY,
        fields: @fields.join(','),
      }
    end
  end
end
