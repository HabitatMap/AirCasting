require 'swagger_helper'

RSpec.describe 'AirBeamMini2 Fixed Sessions', type: :request do
  path '/api/v3/fixed_sessions' do
    post 'Create a new AirBeamMini2 fixed session' do
      tags 'AirBeamMini2'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates a new fixed session for an AirBeamMini2 device. The mobile app calls this
        before configuring the AirBeam. The response includes a `measurement_type_id` per
        stream that the AirBeam uses to identify stream types in the binary upload payload.
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[uuid title latitude longitude contribute airbeam streams],
        properties: {
          uuid: { type: :string, format: :uuid, example: '550e8400-e29b-41d4-a716-446655440000' },
          title: { type: :string, example: 'Rooftop PM2.5 monitor' },
          latitude: { type: :number, format: :float, example: 40.7128 },
          longitude: { type: :number, format: :float, example: -74.0060 },
          contribute: { type: :boolean, example: true },
          airbeam: {
            type: :object,
            required: %w[mac_address model],
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF' },
              model: { type: :string, example: 'AirBeamMini2' },
              name: { type: :string, nullable: true, example: 'Roof sensor' },
            },
          },
          streams: {
            type: :array,
            minItems: 1,
            items: {
              type: :object,
              required: %w[measurement_type unit],
              properties: {
                measurement_type: { type: :string, example: 'Particulate Matter' },
                unit: { type: :string, example: 'µg/m³' },
              },
            },
            example: [
              { measurement_type: 'Particulate Matter', unit: 'µg/m³' },
              { measurement_type: 'Particulate Matter', unit: 'µg/m³' },
            ],
          },
        },
      }

      response '200', 'session created' do
        schema type: :object,
               required: %w[location streams],
               properties: {
                 location: { type: :string, example: 'http://aircasting.org/s/ab12c' },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[measurement_type unit measurement_type_id],
                     properties: {
                       measurement_type: { type: :string, example: 'Particulate Matter' },
                       unit: { type: :string, example: 'µg/m³' },
                       measurement_type_id: {
                         type: :integer,
                         description: 'Compact numeric ID used by the AirBeam in the binary upload format to identify this stream',
                         example: 1,
                       },
                     },
                   },
                 },
               }

        it('returns the documented response') { skip 'swagger doc' }
      end

      response '400', 'validation error' do
        schema type: :object,
               properties: {
                 errors: { type: :object, additionalProperties: { type: :array, items: { type: :string } } },
               }

        it('returns the documented response') { skip 'swagger doc' }
      end

      response '401', 'unauthorized' do
        it('returns the documented response') { skip 'swagger doc' }
      end
    end
  end

  path '/api/v3/fixed_sessions/{uuid}/measurements' do
    post 'Upload binary measurements for an AirBeamMini2 session' do
      tags 'AirBeamMini2'
      consumes 'application/octet-stream'
      produces 'application/json'
      description <<~DESC
        Receives a binary measurement payload from the AirBeamMini2. Can be called once per
        minute for live uploads or once (with many measurements) for sync after connectivity loss.

        ## Binary Format (big-endian)

        ```
        Offset     Size  Type        Description
        0          4     char[4]     Magic bytes: "ABBA" (0x41 0x42 0x42 0x41)
        4          2     uint16 BE   Measurement count N
        --- repeated N times ---
        6+i*9      4     uint32 BE   Unix timestamp (seconds since epoch, UTC)
        10+i*9     1     uint8       measurement_type_id (returned by session creation endpoint)
        11+i*9     4     float32 BE  Sensor value
        --- end repeat ---
        6+N*9      1     uint8       XOR checksum of all preceding bytes
        ```

        **Resend / sync behaviour:** sending a measurement with an already-stored
        `(stream_id, time_with_time_zone)` pair updates the stored value (upsert).

        **Averages:** pass `sync=true` to trigger daily and hourly average recalculation
        after bulk uploads. Not needed for regular live 1-per-minute uploads.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'Session UUID (same as used in session creation)'

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      parameter name: :sync, in: :query, type: :boolean, required: false,
                description: 'Set to true to trigger average recalculation after bulk upload'

      parameter name: :body, in: :body, required: true, schema: {
        type: :string,
        format: :binary,
        description: 'Binary payload as described in the endpoint description',
      }

      response '200', 'measurements stored' do
        it('returns the documented response') { skip 'swagger doc' }
      end

      response '400', 'invalid binary payload (bad magic, checksum, or unknown measurement_type_id)' do
        it('returns the documented response') { skip 'swagger doc' }
      end

      response '401', 'unauthorized' do
        it('returns the documented response') { skip 'swagger doc' }
      end

      response '404', 'session not found' do
        it('returns the documented response') { skip 'swagger doc' }
      end
    end
  end
end
