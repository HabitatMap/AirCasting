require 'swagger_helper'

RSpec.describe 'AirBeam Fixed Sessions', type: :request do
  def build_measurement_binary(type_id:, epoch: Time.current.to_i, value: 12.5)
    header = ["\xAB\xBA", 1].pack('a2n')
    measurement = [epoch, type_id, value].pack('NCg')
    payload = header + measurement
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  ERROR_SCHEMA = {
    type: :object,
    required: %w[error_code message],
    properties: {
      error_code: { type: :string },
      message: { type: :string },
    },
  }.freeze

  path '/api/v3/fixed_sessions' do
    post 'Create a new AirBeam fixed session' do
      tags 'AirBeam'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates a new fixed session for an AirBeam device. The mobile app calls this
        before configuring the AirBeam. The response includes a `sensor_type_id` per
        stream that the AirBeam uses to identify stream types in the binary upload payload.

        ## Error Codes

        | `error_code` | HTTP | Description |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token |
        | `validation_error` | 400 | Request body failed validation. See `fields` for per-field details |
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
          is_indoor: { type: :boolean, nullable: true, example: false, description: 'Whether the sensor is deployed indoors. Defaults to false when omitted.' },
          airbeam: {
            type: :object,
            required: %w[mac_address model],
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF' },
              model: { type: :string, example: 'AirBeamMini' },
              name: { type: :string, nullable: true, example: 'Roof sensor' },
            },
          },
          streams: {
            type: :array,
            minItems: 1,
            items: {
              type: :object,
              required: %w[sensor_name unit_symbol],
              properties: {
                sensor_name: {
                  type: :string,
                  description: 'Sensor name as reported by the device (e.g. AirBeamMini-PM1, AirBeamMini-PM2.5)',
                  example: 'AirBeamMini-PM2.5',
                },
                unit_symbol: {
                  type: :string,
                  description: 'Unit symbol for this sensor (e.g. µg/m³, %, F)',
                  example: 'µg/m³',
                },
              },
            },
            example: [
              { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
            ],
          },
        },
      }

      response '201', 'session created' do
        schema type: :object,
               required: %w[location session_token streams],
               properties: {
                 location: { type: :string, example: 'http://aircasting.org/s/ab12c' },
                 session_token: {
                   type: :string,
                   description: 'Bearer token for AirBeam measurement uploads. The mobile app passes this to the AirBeam over BLE after session creation.',
                   example: 'a3f2c1d4e5b6a7f8c9d0e1f2a3b4c5d6',
                 },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[sensor_name sensor_type_id],
                     properties: {
                       sensor_name: { type: :string, example: 'AirBeam-PM2.5' },
                       sensor_type_id: {
                         type: :integer,
                         description: 'Compact numeric ID used by the AirBeam in the binary upload format to identify this stream',
                         example: 2,
                       },
                     },
                   },
                 },
               }

        before(:all) do
          @ts_pm1 = FactoryBot.create(:threshold_set, :air_beam_pm1, :default)
          @ts_pm2_5 = FactoryBot.create(:threshold_set, :air_beam_pm2_5, :default)
        end

        after(:all) do
          @ts_pm1&.destroy
          @ts_pm2_5&.destroy
        end

        let!(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) do
          {
            uuid: SecureRandom.uuid,
            title: 'Rooftop PM2.5 monitor',
            latitude: 40.7128,
            longitude: -74.0060,
            contribute: true,
            airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
            streams: [
              { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
            ],
          }
        end

        before { sign_in user }

        run_test!
      end

      response '400', 'validation error' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: {
                   type: :object,
                   description: 'Per-field validation errors',
                   additionalProperties: { type: :array, items: { type: :string } },
                 },
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { { uuid: '' } }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:Authorization) { 'Token token=invalid' }
        let(:body) { {} }

        run_test!
      end
    end
  end

  path '/api/v3/fixed_sessions/{uuid}/measurements' do
    post 'Upload binary measurements for an AirBeam session' do
      tags 'AirBeam'
      consumes 'application/octet-stream'
      produces 'application/json'
      description <<~DESC
        Receives a binary measurement payload from the AirBeam. Can be called once per
        minute for live uploads or in bulk after connectivity loss — both are handled identically.

        ## Binary Format

        ```
        Offset     Size  Type        Description
        0          2     uint8[2]    Magic bytes: 0xAB 0xBA
        2          2     uint16 BE   Measurement count N
        --- repeated N times ---
        4+i*9      4     uint32 BE   Unix timestamp (seconds since epoch, UTC)
        8+i*9      1     uint8       sensor_type_id (returned by session creation endpoint)
        9+i*9      4     float32 BE  Sensor value
        --- end repeat ---
        4+N*9      1     uint8       XOR checksum of all preceding bytes
        ```

        **Resend behaviour:** sending a measurement with an already-stored
        `(stream_id, time_with_time_zone)` pair is silently ignored — no duplicate is created.

        **Time synchronisation:** an empty body is valid and returns 200 immediately. The AirBeam
        uses this to read the current server time from the `X-Server-Time` response header
        (Unix epoch, UTC) when its clock drifts.

        ## Error Codes

        All error responses share the shape `{ "error_code": "...", "message": "..." }`.

        | `error_code` | HTTP | Description |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token |
        | `session_not_found` | 404 | No session with the given UUID exists for this user/token |
        | `payload_too_short` | 400 | Payload has fewer bytes than required for even one frame |
        | `invalid_magic_bytes` | 400 | First 2 bytes are not `0xAB 0xBA` |
        | `empty_measurement_count` | 400 | Frame count field in header is zero |
        | `payload_size_mismatch` | 400 | Actual payload size does not match the declared frame count |
        | `invalid_checksum` | 400 | XOR checksum of payload does not match the final byte |
        | `invalid_epoch` | 400 | A frame's timestamp is zero or implausibly far in the future |
        | `invalid_value` | 400 | A frame's sensor value is NaN or Infinity |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'Session UUID (same as used in session creation)'

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Mobile app: `Token token=<user_token>`. AirBeam: `Bearer <session_token>` (returned by session creation endpoint).'

      parameter name: :body, in: :body, required: true, schema: {
        type: :string,
        format: :binary,
        description: 'Binary payload as described in the endpoint description',
      }

      response '200', 'measurements stored (or empty body time-sync)' do
        before(:all) do
          @user = create(:user)
          @session = create(:fixed_session, user: @user)
          @threshold_set = ThresholdSet.find_or_create_by!(
            sensor_name: 'AirBeam-PM2.5', unit_symbol: 'µg/m³', is_default: true,
            threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
            threshold_high: 55, threshold_very_high: 150,
          )
          @stream = Stream.create!(
            session: @session,
            sensor_name: 'AirBeam-PM2.5',
            sensor_package_name: 'AA:BB:CC:DD:EE:FF',
            unit_name: 'micrograms per cubic meter',
            measurement_type: 'Particulate Matter',
            measurement_short_type: 'PM',
            unit_symbol: 'µg/m³',
            threshold_set: @threshold_set,
            sensor_type_id: 2,
            min_latitude: 40.7128,
            max_latitude: 40.7128,
            min_longitude: -74.006,
            max_longitude: -74.006,
          )
        end

        after(:all) do
          @stream&.delete
          @threshold_set&.delete
          @session&.delete
          @user&.destroy
        end

        let(:uuid) { @session.uuid }
        let(:Authorization) { "Token token=#{@user.authentication_token}" }
        let(:body) { build_measurement_binary(type_id: 2) }

        before { sign_in @user }

        run_test!
      end

      response '400', 'invalid payload or unknown sensor_type_id' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:session) { create(:fixed_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { 'not valid binary' }

        before { sign_in user }

        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:uuid) { 'non-existent-uuid' }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { build_measurement_binary(type_id: 1) }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        let(:body) { "\x00" }

        run_test!
      end
    end
  end
end
