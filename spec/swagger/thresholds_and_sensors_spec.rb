require 'swagger_helper'

# Model-agnostic lookups reused by mobile: threshold sets per sensor, and the
# sensor list per session type.
RSpec.describe 'Thresholds and sensors', type: :request do
  path '/api/thresholds/{id}' do
    get 'Threshold set for a sensor' do
      tags 'Sensors & thresholds'
      produces 'application/json'
      security []
      description <<~DESC
        Returns the default (or most popular) threshold set for a sensor as an ordered
        array of 5 stringified integers: `[very_low, low, medium, high, very_high]`.
        Public (no auth). `id` is the sensor name and may contain dots/slashes.
      DESC

      parameter name: :id, in: :path, type: :string, required: true,
                description: 'Sensor name (e.g. AirBeam-PM2.5, Government-PM2.5)'
      parameter name: :unit_symbol, in: :query, type: :string, required: true,
                description: 'Unit symbol (e.g. µg/m³, ppb)'

      response '200', 'threshold set' do
        schema type: :array,
               minItems: 5, maxItems: 5,
               items: { type: :string, description: 'Stringified integer threshold' },
               example: %w[0 9 35 55 150]

        let(:id) { 'AirBeam-PM2.5' }
        let(:unit_symbol) { 'µg/m³' }

        before do
          create(:threshold_set, :air_beam_pm2_5, :default)
        end

        run_test!
      end
    end
  end

  path '/api/sensors' do
    get 'Sensors available for a session type' do
      tags 'Sensors & thresholds'
      produces 'application/json'
      security []
      description <<~DESC
        Returns the aggregated built-in AirBeam sensors plus every distinct contributed
        sensor for the given `session_type` (with a per-sensor `session_count`). Public
        (no auth). Cached for 8 hours. Built-in aggregated rows have `id: null` and
        `session_count: 0`.
      DESC

      parameter name: :session_type, in: :query, type: :string, required: true,
                description: 'STI session class name: "MobileSession" or "FixedSession"'

      response '200', 'sensors' do
        schema type: :array,
               items: {
                 type: :object,
                 required: %w[sensor_name measurement_type unit_symbol session_count],
                 properties: {
                   id: { type: :integer, nullable: true, description: 'null for built-in aggregated sensors' },
                   session_count: { type: :integer, example: 0 },
                   sensor_name: { type: :string, example: 'AirBeam-PM2.5' },
                   measurement_type: { type: :string, example: 'Particulate Matter' },
                   unit_symbol: { type: :string, example: 'µg/m³' },
                 },
               }

        let(:session_type) { 'MobileSession' }

        run_test!
      end

      response '400', 'validation error (missing session_type)' do
        schema type: :object, additionalProperties: true

        let(:session_type) { '' }

        run_test!
      end
    end
  end
end
