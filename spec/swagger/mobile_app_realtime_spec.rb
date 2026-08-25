require 'swagger_helper'

# Mobile apps (iOS/Android): fixed WiFi realtime streaming (legacy flow).
RSpec.describe 'Mobile app — realtime (fixed WiFi)', type: :request do
  let(:Authorization) { "Token token=#{user.authentication_token}" }

  # Decoded shape of the `data` string for POST /api/realtime/measurements.
  # One request carries ONE stream descriptor + its measurements.
  MEASUREMENTS_DATA_PAYLOAD = {
    type: :object,
    required: %w[session_uuid sensor_name sensor_package_name measurement_type
                 measurement_short_type unit_name unit_symbol threshold_very_low
                 threshold_low threshold_medium threshold_high threshold_very_high measurements],
    properties: {
      session_uuid: { type: :string, description: 'UUID of an existing fixed session owned by the authenticated user (created via POST /api/realtime/sessions).', example: '550e8400-e29b-41d4-a716-446655440000' },
      sensor_name: { type: :string, description: 'Match key for the stream within the session. If no stream with this sensor_name exists yet, one is created from the descriptor below.', example: 'AirBeam2-PM2.5' },
      sensor_package_name: { type: :string, example: 'AirBeam2:00189610719F' },
      measurement_type: { type: :string, example: 'Particulate Matter' },
      measurement_short_type: { type: :string, example: 'PM' },
      unit_name: { type: :string, example: 'microgram per cubic meter' },
      unit_symbol: { type: :string, example: 'µg/m³' },
      threshold_very_low: { type: :integer, example: 0 },
      threshold_low: { type: :integer, example: 9 },
      threshold_medium: { type: :integer, example: 35 },
      threshold_high: { type: :integer, example: 55 },
      threshold_very_high: { type: :integer, example: 150 },
      measurements: {
        type: :array,
        description: 'Measurements with time > 48h in the future are dropped.',
        items: {
          type: :object,
          required: %w[longitude latitude time value],
          properties: {
            longitude: { type: :number, format: :float, example: -74.006 },
            latitude: { type: :number, format: :float, example: 40.7128 },
            time: { type: :string, description: 'Parseable datetime string', example: '2026-08-12T10:00:00' },
            value: { type: :integer, description: 'Integer only (contract requires :integer)', example: 12 },
          },
        },
      },
    },
  }.freeze

  # Sample value for the `data` string param (raw JSON; base64+gzip this when compression=true).
  MEASUREMENTS_DATA_EXAMPLE = {
    session_uuid: '550e8400-e29b-41d4-a716-446655440000',
    sensor_name: 'AirBeam2-PM2.5',
    sensor_package_name: 'AirBeam2:00189610719F',
    measurement_type: 'Particulate Matter',
    measurement_short_type: 'PM',
    unit_name: 'microgram per cubic meter',
    unit_symbol: 'µg/m³',
    threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
    threshold_high: 55, threshold_very_high: 150,
    measurements: [
      { longitude: -74.006, latitude: 40.7128, time: '2026-08-12T10:00:00', value: 12 },
      { longitude: -74.006, latitude: 40.7128, time: '2026-08-12T10:01:00', value: 13 },
    ],
  }.to_json.freeze

  path '/api/realtime/sessions.json' do
    post 'Create an AirBeam fixed (WiFi realtime) session' do
      tags 'Mobile app: AirBeam fixed streaming'
      consumes 'multipart/form-data'
      produces 'application/json'
      description <<~DESC
        Creates an AirBeam fixed (WiFi realtime) session. Auth required. Form fields: `session`
        (JSON string — Base64+gzip when `compression` set, else raw), `compression` (flag),
        `photos[]` (optional). The decoded `session` has the same shape as a mobile upload
        (uuid, title, lat/lng, start_time/end_time, time_zone, streams keyed by sensor_name),
        but with continuous fixed streams.
      DESC

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          session: { type: :string, description: 'JSON (raw or Base64+gzip). See Mobile app: Sessions & sync for the decoded shape.' },
          compression: { type: :boolean },
        },
      }

      response '200', 'created' do
        schema type: :object, required: %w[location notes],
               properties: {
                 location: { type: :string },
                 notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
               }
        skip 'swagger doc: upload payload not exercised live'
      end
    end
  end

  path '/api/realtime/measurements' do
    post 'Stream AirBeam fixed measurements' do
      tags 'Mobile app: AirBeam fixed streaming'
      consumes 'multipart/form-data'
      produces 'application/json'
      description <<~DESC
        Appends measurements to one stream of an existing AirBeam fixed session. Auth required.
        Empty 200 body on success.

        **One request = one stream.** The `data` payload is a single stream descriptor plus its
        `measurements` array.

        **How measurements are matched to a stream:**
        - **Session**: found by the authenticated user + `session_uuid`. The session must already
          exist (created via `POST /api/realtime/sessions`); otherwise `400 "session not found"`.
        - **Stream**: found within that session by **`sensor_name`**. If no stream with that
          `sensor_name` exists yet, one is **created** from the descriptor
          (`sensor_package_name`, `measurement_type`, units, thresholds). So to stream several
          sensors, send one request per `sensor_name`.
        - `value` must be an **integer**; `time` a parseable datetime string; measurements more
          than 48h in the future are dropped.

        **Form fields:** `data` (the JSON below), `compression` (flag). When `compression` is set,
        `data` is Base64-encoded gzip (`:sync` flow — recalculates hourly/daily averages);
        otherwise raw JSON (`:live` flow).

        **Sample `data` (raw JSON):**
        ```json
        {
          "session_uuid": "550e8400-e29b-41d4-a716-446655440000",
          "sensor_name": "AirBeam2-PM2.5",
          "sensor_package_name": "AirBeam2:00189610719F",
          "measurement_type": "Particulate Matter",
          "measurement_short_type": "PM",
          "unit_name": "microgram per cubic meter",
          "unit_symbol": "µg/m³",
          "threshold_very_low": 0, "threshold_low": 9, "threshold_medium": 35,
          "threshold_high": 55, "threshold_very_high": 150,
          "measurements": [
            { "longitude": -74.006, "latitude": 40.7128, "time": "2026-08-12T10:00:00", "value": 12 },
            { "longitude": -74.006, "latitude": 40.7128, "time": "2026-08-12T10:01:00", "value": 13 }
          ]
        }
        ```
      DESC

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[data],
        properties: {
          data: {
            type: :string,
            description: 'The stream descriptor + measurements as a JSON string (raw, or Base64+gzip when compression=true). Decoded shape shown in `decoded_data`.',
            example: MEASUREMENTS_DATA_EXAMPLE,
          },
          compression: { type: :boolean, description: 'When true, `data` is Base64-encoded gzip.' },
          decoded_data: MEASUREMENTS_DATA_PAYLOAD, # documentation only — the decoded `data`
        },
      }

      response '200', 'measurements stored (empty body)' do
        skip 'swagger doc: streaming payload not exercised live'
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }
        skip 'swagger doc: streaming payload not exercised live'
      end
    end
  end

  path '/api/realtime/sync_measurements.json' do
    get 'Poll an AirBeam fixed session for new measurements' do
      tags 'Mobile app: AirBeam fixed streaming'
      produces 'application/json'
      security []
      description <<~DESC
        Returns an AirBeam fixed session with measurements newer than `last_measurement_sync`
        (capped to a 24h window). Public (no auth). Times are ISO 8601 with milliseconds.
      DESC

      parameter name: :uuid, in: :query, type: :string, required: true, description: 'Session UUID'
      parameter name: :last_measurement_sync, in: :query, type: :string, required: true, description: 'Datetime; only newer measurements are returned'

      response '200', 'session with new measurements' do
        schema type: :object,
               required: %w[id type uuid title start_time end_time version streams],
               properties: {
                 id: { type: :integer },
                 type: { type: :string, example: 'FixedSession' },
                 uuid: { type: :string },
                 title: { type: :string },
                 tag_list: { type: :string },
                 start_time: { type: :string, description: 'ISO 8601 with ms' },
                 end_time: { type: :string },
                 version: { type: :integer },
                 streams: {
                   type: :object,
                   description: 'Keyed by sensor_name',
                   example: {
                     'AirBeam2-PM2.5' => {
                       id: 456, sensor_name: 'AirBeam2-PM2.5', sensor_package_name: 'AirBeam2:00189610719F',
                       unit_name: 'microgram per cubic meter', measurement_type: 'Particulate Matter',
                       measurement_short_type: 'PM', unit_symbol: 'µg/m³',
                       threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
                       threshold_high: 55, threshold_very_high: 150,
                       measurements: [{ id: 1, stream_id: 456, value: 12.5, time: '2026-08-12T10:00:00.000Z', latitude: 40.7, longitude: -74.0, milliseconds: 0 }]
                     },
                   },
                   additionalProperties: {
                     type: :object,
                     properties: {
                       id: { type: :integer },
                       sensor_name: { type: :string },
                       sensor_package_name: { type: :string },
                       unit_name: { type: :string },
                       measurement_type: { type: :string },
                       measurement_short_type: { type: :string },
                       unit_symbol: { type: :string },
                       threshold_very_low: { type: :number },
                       threshold_low: { type: :number },
                       threshold_medium: { type: :number },
                       threshold_high: { type: :number },
                       threshold_very_high: { type: :number },
                       measurements: {
                         type: :array,
                         items: {
                           type: :object,
                           properties: {
                             id: { type: :integer },
                             stream_id: { type: :integer },
                             value: { type: :number },
                             time: { type: :string, description: 'UTC ISO 8601 with ms' },
                             latitude: { type: :number, format: :float },
                             longitude: { type: :number, format: :float },
                             milliseconds: { type: :integer, example: 0 },
                           },
                         },
                       },
                     },
                   },
                 },
               }

        let(:session) { create(:fixed_session, uuid: 'poll-uuid-1', last_measurement_at: Time.current) }
        let(:stream) { create(:stream, :fixed, session: session) }
        let(:uuid) { session.uuid }
        let(:last_measurement_sync) { '2000-01-01T00:00:00' }
        before { create(:fixed_measurement, stream: stream, time: Time.current, time_with_time_zone: Time.current.utc) }
        run_test!
      end
    end
  end
end
