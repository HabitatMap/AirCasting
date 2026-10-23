require 'swagger_helper'

RSpec.describe 'Explore map', type: :request do
  value_schema = {
    type: :integer,
    description: 'Present only when exactly one measurement type is selected; rounded to a whole number. ' \
                 'AirBeam: last hourly average, or the newest reading while the session has none yet. ' \
                 'Government: newest reading. Several streams of the type: their mean',
    example: 12,
  }

  station_schema = {
    type: :object,
    required: %w[type uuid source title provider latitude longitude last_measured_at measurement_types],
    properties: {
      type: { type: :string, enum: ['station'] },
      uuid: {
        type: :string, format: :uuid, example: '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b',
        description: '`sessions.uuid` for AirBeam, `stations.uuid` for government',
      },
      source: { type: :string, enum: Explore::Map::SOURCES, example: 'government' },
      title: { type: :string, example: 'CCNY' },
      provider: {
        type: :string, example: 'US EPA AirNow',
        description: "AirBeam: the owner's username. Government: the source's full name",
      },
      latitude: { type: :number, format: :double, example: 40.8198 },
      longitude: { type: :number, format: :double, example: -73.9483 },
      last_measured_at: {
        type: :integer, format: :int64, example: 1_792_152_000_000,
        description: 'Epoch milliseconds, UTC: the newest of its selected streams',
      },
      measurement_types: {
        type: :array,
        description: 'The selected measurement types this item measures, in catalogue order',
        items: { type: :string, enum: Explore::Parameters::KEYS },
        example: ['Particulate Matter', 'Nitrogen Dioxide'],
      },
      value: value_schema,
    },
  }

  cluster_schema = {
    type: :object,
    required: %w[type latitude longitude count],
    properties: {
      type: { type: :string, enum: ['cluster'] },
      latitude: { type: :number, format: :double, description: 'Mean of its members', example: 40.7484 },
      longitude: { type: :number, format: :double, description: 'Mean of its members', example: -73.9857 },
      count: { type: :integer, minimum: 2, example: 37 },
      value: value_schema.merge(description: "Mean of its members' values. #{value_schema[:description]}"),
    },
  }

  path '/api/v3/explore/map' do
    get '[ALPHA] Active AirBeam fixed sessions and government stations in a viewport, clustered' do
      tags 'Mobile app: Explore map'
      produces 'application/json'
      security []
      description <<~DESC
        Active, outdoor, public AirBeam fixed sessions and government stations
        (EPA) that have any of the selected parameters, in one list.

        The viewport is snapped outward to whole grid cells before querying, so
        markers just off-screen can be returned. Items sharing a grid cell
        become one `cluster`; a lone item stays a `station`. From zoom
        #{Explore::Clusterer::NO_CLUSTER_ZOOM} on nothing is clustered.

        An item is identified by `uuid`. Items and clusters carry a `value` only
        when exactly one measurement type is selected.
      DESC

      parameter name: :west, in: :query, required: true,
                schema: { type: :number, format: :double, minimum: -180, maximum: 180 },
                description: 'Greater than `east` when the viewport crosses the antimeridian'
      parameter name: :east, in: :query, required: true,
                schema: { type: :number, format: :double, minimum: -180, maximum: 180 }
      parameter name: :south, in: :query, required: true,
                schema: { type: :number, format: :double, minimum: -90, maximum: 90 }
      parameter name: :north, in: :query, required: true,
                schema: { type: :number, format: :double, minimum: -90, maximum: 90 },
                description: 'Not less than `south`'
      parameter name: :zoom, in: :query, required: true,
                schema: { type: :integer, minimum: 0, maximum: Api::ExploreMapContract::MAX_ZOOM },
                description: "The map's zoom rounded to a whole number, as the web map does"
      parameter name: :sources, in: :query, required: false, style: :form, explode: false,
                schema: { type: :array, items: { type: :string, enum: Explore::Map::SOURCES } },
                description: 'Comma-separated. Omitted or empty: all. An unknown value is a 400'
      parameter name: :measurement_types, in: :query, required: false, style: :form, explode: false,
                schema: { type: :array, items: { type: :string, enum: Explore::Parameters::KEYS } },
                description: 'Comma-separated `measurement_type` values, as in `/api/sensors`. Omitted or ' \
                             'empty: all. An item is returned when it measures any of them. An unknown value is a 400'

      let(:west) { -75 }
      let(:east) { -73 }
      let(:south) { 40 }
      let(:north) { 41 }

      response '200', 'map items and clusters' do
        schema type: :object,
               required: %w[items],
               properties: {
                 items: { type: :array, items: { oneOf: [station_schema, cluster_schema] } },
               }

        let(:measured_at) { 1.hour.ago.change(usec: 0) }
        let(:epa) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
        let!(:station) do
          create(:station, source: epa, title: 'CCNY', location: 'SRID=4326;POINT(-73.9483 40.8198)')
        end
        let!(:station_stream) do
          create(
            :station_stream,
            source: epa,
            station: station,
            stream_configuration: create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³'),
            location: station.location,
            first_measured_at: measured_at,
            last_measured_at: measured_at,
          ).tap do |stream|
            create(:station_measurement, station_stream: stream, measured_at: measured_at, value: 8.5)
          end
        end
        let!(:session) do
          create(
            :fixed_session,
            title: 'Roof',
            latitude: 40.70,
            longitude: -74.00,
            last_measurement_at: 5.minutes.ago,
          ).tap do |session|
            stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
            create(
              :fixed_measurement,
              stream: stream,
              value: 12.4,
              time: measured_at,
              time_with_time_zone: measured_at,
            )
          end
        end
        let(:zoom) { Explore::Clusterer::NO_CLUSTER_ZOOM }
        let(:sources) { %w[airbeam government] }
        let(:measurement_types) { ['Particulate Matter'] }

        run_test! do |response|
          items = JSON.parse(response.body)['items']

          expect(items.map { |item| [item['type'], item['source'], item['uuid']] })
            .to contain_exactly(
              ['station', 'airbeam', session.uuid],
              ['station', 'government', station.reload.uuid],
            )
          airbeam = items.find { |item| item['source'] == 'airbeam' }
          expect(airbeam).to include(
            'title' => 'Roof',
            'provider' => session.user.username,
            'last_measured_at' => measured_at.to_i * 1_000,
            'measurement_types' => ['Particulate Matter'],
            'value' => 12,
          )
          government = items.find { |item| item['source'] == 'government' }
          expect(government).to include('title' => 'CCNY', 'provider' => 'US EPA AirNow', 'value' => 9)
        end
      end

      response '400', 'invalid query parameters' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Query parameters are invalid' },
                 fields: ERROR_FIELDS_SCHEMA.merge(
                   example: {
                     zoom: [{ code: 'not_an_integer', message: 'must be an integer' }],
                     measurement_types: [
                       { code: 'unknown_value',
                         message: 'unknown: PM10',
                         params: { unknown: ['PM10'] } },
                     ],
                   },
                 ),
               }

        let(:zoom) { 9.5 }
        let(:sources) { %w[purpleair] }

        run_test! do |response|
          fields = JSON.parse(response.body)['fields']

          expect(fields).to eq(
            'zoom' => [{ 'code' => 'not_an_integer', 'message' => 'must be an integer' }],
            'sources' => [
              {
                'code' => 'unknown_value',
                'message' => 'unknown: purpleair',
                'params' => { 'unknown' => ['purpleair'], 'allowed' => %w[airbeam government] },
              },
            ],
          )
        end
      end
    end
  end

  # Not documented: behaviour the schema cannot show.
  describe 'GET /api/v3/explore/map' do
    # Two AirBeams 1 km apart, PM2.5 10 and 20: one grid cell at zoom 5.
    before do
      [[40.70, 10.0], [40.71, 20.0]].each do |latitude, value|
        session = create(:fixed_session, latitude: latitude, longitude: -74.0, last_measurement_at: 5.minutes.ago)
        stream = create(:stream, session: session, sensor_name: 'AirBeam3-PM2.5')
        create(:fixed_measurement, stream: stream, value: value, time: 1.hour.ago, time_with_time_zone: 1.hour.ago)
      end
    end

    it 'clusters items sharing a grid cell when zoomed out' do
      get '/api/v3/explore/map', params: { west: -75, east: -73, south: 40, north: 41, zoom: 5 }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['items']).to match(
        [{ 'type' => 'cluster', 'latitude' => be_within(1e-9).of(40.705), 'longitude' => -74.0, 'count' => 2 }],
      )
    end

    it "gives the cluster its members' mean value when one measurement type is selected" do
      get '/api/v3/explore/map',
          params: { west: -75, east: -73, south: 40, north: 41, zoom: 5, measurement_types: 'Particulate Matter' }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['items']).to match(
        [hash_including('type' => 'cluster', 'count' => 2, 'value' => 15)],
      )
    end
  end
end
