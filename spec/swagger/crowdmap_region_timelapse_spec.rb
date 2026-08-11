require 'swagger_helper'

# Web map aggregations: CrowdMap grid averages, region summary, timelapse clusters.
RSpec.describe 'Map aggregations (web)', type: :request do
  path '/api/averages2.json' do
    get 'CrowdMap grid-cell averages in a bounding box' do
      tags 'Map aggregations'
      produces 'application/json'
      security []
      description <<~DESC
        Returns averaged measurement values over a grid, for the CrowdMap. Public (no auth).
        `q` is URL-encoded JSON with: `north`, `south`, `east`, `west` (float);
        `time_from`, `time_to`, `day_from`, `day_to`, `year_from`, `year_to`,
        `grid_size_x`, `grid_size_y` (int); `measurement_type`, `sensor_name`,
        `unit_symbol`, `usernames`, `tags` (string); `stream_ids` (array of int, optional).
      DESC

      parameter name: :q, in: :query, type: :string, required: true, description: 'URL-encoded JSON filter'

      response '200', 'grid averages' do
        schema type: :array,
               items: {
                 type: :object,
                 required: %w[value west east south north],
                 properties: {
                   value: { type: :number, format: :float },
                   west: { type: :number, format: :float },
                   east: { type: :number, format: :float },
                   south: { type: :number, format: :float },
                   north: { type: :number, format: :float },
                 },
               }

        let(:q) do
          {
            north: 90.0, south: -90.0, east: 180.0, west: -180.0,
            time_from: 1.day.ago.to_i, time_to: Time.current.to_i,
            grid_size_x: 50, grid_size_y: 50,
            measurement_type: 'Particulate Matter', sensor_name: 'AirBeam2-PM2.5',
            unit_symbol: 'µg/m³', usernames: '', tags: '',
          }.to_json
        end
        run_test!
      end
    end
  end

  path '/api/region.json' do
    get 'Region summary (average, contributors, samples)' do
      tags 'Map aggregations'
      produces 'application/json'
      security []
      description <<~DESC
        Returns a summary for a rectangular region. Public (no auth). Uses **flat** query
        params (not a `q` wrapper): `north`, `south`, `east`, `west` (float);
        `time_from`, `time_to`, `grid_size_x`, `grid_size_y` (int); `usernames`,
        `tags` (string); `stream_ids` (comma-separated string).
      DESC

      parameter name: :north, in: :query, type: :number, required: true
      parameter name: :south, in: :query, type: :number, required: true
      parameter name: :east, in: :query, type: :number, required: true
      parameter name: :west, in: :query, type: :number, required: true
      parameter name: :time_from, in: :query, type: :integer, required: false, description: 'Epoch seconds'
      parameter name: :time_to, in: :query, type: :integer, required: false, description: 'Epoch seconds'
      parameter name: :sensor_name, in: :query, type: :string, required: false
      parameter name: :measurement_type, in: :query, type: :string, required: false
      parameter name: :unit_symbol, in: :query, type: :string, required: false
      parameter name: :usernames, in: :query, type: :string, required: false
      parameter name: :tags, in: :query, type: :string, required: false
      parameter name: :stream_ids, in: :query, type: :string, required: false, description: 'Comma-separated stream ids'

      response '200', 'region summary' do
        schema type: :object,
               required: %w[average number_of_contributors number_of_samples],
               properties: {
                 average: { type: :number, format: :float, nullable: true },
                 number_of_contributors: { type: :integer },
                 number_of_samples: { type: :integer },
               }

        let(:north) { 90.0 }
        let(:south) { -90.0 }
        let(:east) { 180.0 }
        let(:west) { -180.0 }
        let(:sensor_name) { 'AirBeam2-PM2.5' }
        let(:measurement_type) { 'Particulate Matter' }
        let(:unit_symbol) { 'µg/m³' }
        let(:usernames) { '' }
        let(:tags) { '' }
        let(:stream_ids) { '' }
        run_test!
      end
    end
  end

  path '/api/v3/timelapse' do
    get 'Timelapse clusters by hour' do
      tags 'Map aggregations'
      produces 'application/json'
      security []
      description <<~DESC
        Returns clustered hourly averages for the timelapse animation. Public (no auth).
        Response is an object keyed by hour timestamp ("YYYY-MM-DD HH:MM:SS +0000"),
        each value an array of cluster points. `q` is URL-encoded JSON validated by the
        same contract as the fixed session lists (required: `time_from`, `time_to`
        (epoch seconds), `sensor_name`, `measurement_type`, `unit_symbol`, `tags`,
        `usernames`; optional bbox + `zoom_level`). Government sensors are supported.
      DESC

      parameter name: :q, in: :query, type: :string, required: true, description: 'URL-encoded JSON filter'

      response '200', 'clusters keyed by hour' do
        schema type: :object,
               additionalProperties: {
                 type: :array,
                 items: {
                   type: :object,
                   required: %w[value latitude longitude sessions],
                   properties: {
                     value: { type: :number, format: :float },
                     latitude: { type: :number, format: :float },
                     longitude: { type: :number, format: :float },
                     sessions: { type: :integer, description: 'Number of streams in the cluster' },
                   },
                 },
               }

        let(:q) do
          {
            time_from: 1.day.ago.to_i, time_to: Time.current.to_i,
            sensor_name: 'airbeam2-pm2.5', measurement_type: 'Particulate Matter',
            unit_symbol: 'µg/m³', tags: '', usernames: '',
            west: -180.0, east: 180.0, south: -90.0, north: 90.0,
          }.to_json
        end
        run_test!
      end
    end
  end
end
