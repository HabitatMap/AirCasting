require 'swagger_helper'

RSpec.describe 'AirBeamMini2 Fixed Sessions', type: :request do
  def build_measurement_binary(type_id:, epoch: Time.current.to_i, value: 12.5)
    header = ['ABBA', 1].pack('a4n')
    measurement = [epoch, type_id, value].pack('NCg')
    payload = header + measurement
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  path '/api/v3/fixed_sessions' do
    post 'Create a new AirBeamMini2 fixed session' do
      tags 'AirBeamMini2'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates a new fixed session for an AirBeamMini2 device. The mobile app calls this
        before configuring the AirBeam. The response includes a `sensor_type_id` per
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
          is_indoor: { type: :boolean, nullable: true, example: false, description: 'Whether the sensor is deployed indoors. Defaults to false when omitted.' },
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
              required: %w[sensor_name unit_symbol],
              properties: {
                sensor_name: {
                  type: :string,
                  description: 'Sensor name as reported by the device (e.g. AirBeamMini2-PM1, AirBeamMini2-PM2.5)',
                  example: 'AirBeamMini2-PM2.5',
                },
                unit_symbol: {
                  type: :string,
                  description: 'Unit symbol for this sensor (e.g. µg/m³, %, F)',
                  example: 'µg/m³',
                },
              },
            },
            example: [
              { sensor_name: 'AirBeamMini2-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini2-PM2.5', unit_symbol: 'µg/m³' },
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
            airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini2' },
            streams: [
              { sensor_name: 'AirBeamMini2-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini2-PM2.5', unit_symbol: 'µg/m³' },
            ],
          }
        end

        before { sign_in user }

        run_test!
      end

      response '400', 'validation error' do
        schema type: :object,
               additionalProperties: { type: :array, items: { type: :string } }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { { uuid: '' } }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        let(:Authorization) { 'Token token=invalid' }
        let(:body) { {} }

        run_test!
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
        minute for live uploads or in bulk after connectivity loss — both are handled identically.

        ## Binary Format

        ```
        Offset     Size  Type        Description
        0          4     char[4]     Magic bytes: "ABBA" (0x41 0x42 0x42 0x41)
        4          2     uint16 BE   Measurement count N
        --- repeated N times ---
        6+i*9      4     uint32 BE   Unix timestamp (seconds since epoch, UTC)
        10+i*9     1     uint8       sensor_type_id (returned by session creation endpoint)
        11+i*9     4     float32 BE  Sensor value
        --- end repeat ---
        6+N*9      1     uint8       XOR checksum of all preceding bytes
        ```

        **Resend behaviour:** sending a measurement with an already-stored
        `(stream_id, time_with_time_zone)` pair is silently ignored — no duplicate is created.
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

      response '200', 'measurements stored' do
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

      response '400', 'invalid payload or session/stream not found' do
        let(:user) { create(:user) }
        let(:session) { create(:fixed_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { 'not valid binary' }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        let(:body) { "\x00" }

        run_test!
      end
    end
  end
end
