require 'swagger_helper'

# New AirBeam MOBILE (moving) session API for the app rewrite. Session management
# only — measurements upload is binary (see the /measurements path). All endpoints
# require the user token; the caller owns the sessions (implicit from the token).
RSpec.describe 'AirBeam Mobile Sessions', type: :request do
  ERROR_SCHEMA = {
    type: :object,
    required: %w[error_code message],
    properties: {
      error_code: { type: :string },
      message: { type: :string },
    },
  }.freeze

  path '/api/v3/mobile_sessions' do
    post 'Create a mobile session' do
      tags 'Mobile app: Sessions & sync'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates a new AirBeam mobile (moving) session, wrapping the legacy
        `sessions` / `streams` model. The app calls this once at the start of a
        recording; measurements are then streamed to
        `POST /api/v3/mobile_sessions/{uuid}/measurements`.

        Notes vs. the fixed-session create:
        - `time_zone` is **required** (not derived from coordinates).
        - `start_time` / `end_time` are **not** sent — they are derived from the
          measurement bounds on ingest.
        - `latitude` / `longitude` are optional (the session start point); each
          measurement carries its own location.
        - No `session_token` is returned — the measurements upload authenticates
          with the user token.

        The response includes a `sensor_type_id` per stream, used to identify
        streams in the binary measurement upload.
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[uuid title time_zone contribute airbeam streams],
        properties: {
          uuid: { type: :string, format: :uuid, example: '550e8400-e29b-41d4-a716-446655440000' },
          title: { type: :string, example: 'Morning bike ride' },
          time_zone: { type: :string, example: 'America/New_York', description: 'IANA time zone identifier (required).' },
          contribute: { type: :boolean, example: true },
          tag_list: { type: :string, nullable: true, example: 'commute, bike', description: 'Space/comma separated tags.' },
          latitude: { type: :number, format: :float, nullable: true, example: 40.7128, description: 'Optional session start point.' },
          longitude: { type: :number, format: :float, nullable: true, example: -74.0060 },
          airbeam: {
            type: :object,
            required: %w[mac_address model],
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF' },
              model: { type: :string, example: 'AirBeamMini' },
              name: { type: :string, nullable: true, example: 'My AirBeam' },
            },
          },
          streams: {
            type: :array,
            minItems: 1,
            items: {
              type: :object,
              required: %w[sensor_name unit_symbol],
              properties: {
                sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
                unit_symbol: { type: :string, example: 'µg/m³' },
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
               required: %w[location streams],
               properties: {
                 location: { type: :string, example: 'http://aircasting.org/s/ab12c' },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[sensor_name sensor_type_id],
                     properties: {
                       sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
                       sensor_type_id: { type: :integer, example: 2 },
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
            title: 'Morning bike ride',
            time_zone: 'America/New_York',
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
end
