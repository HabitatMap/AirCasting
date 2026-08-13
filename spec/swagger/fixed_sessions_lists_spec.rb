require 'swagger_helper'

# Web map: fixed session lists (AirBeam + government) in a bounding box.
# Both endpoints take a single `q` param = URL-encoded JSON, validated by
# Api::FixedSessionsContract, and branch to the new station model for gov sensors.
RSpec.describe 'Fixed session lists (web map)', type: :request do
  # Value object inside `streams` for the active (index2) airbeam/gov branches.
  ACTIVE_STREAM_ENTRY = {
    type: :object,
    properties: {
      measurement_short_type: { type: :string, example: 'PM' },
      sensor_name: { type: :string, example: 'AirBeam2-PM2.5' },
      unit_symbol: { type: :string, example: 'µg/m³' },
      id: { type: :integer },
      stream_daily_average: { description: 'AirBeam branch only: rounded integer or the string "no data"', example: 12 },
    },
  }.freeze

  ACTIVE_SESSIONS_SCHEMA = {
    type: :object,
    required: %w[fetchableSessionsCount sessions],
    properties: {
      fetchableSessionsCount: { type: :integer, example: 0 },
      sessions: {
        type: :array,
        items: {
          type: :object,
          properties: {
            id: { type: :integer, description: 'AirBeam fixed: sessions.id. Station (government): station_streams.id' },
            uuid: { type: :string },
            end_time_local: { type: :string, nullable: true, description: 'Local wall time, e.g. 2026-08-01T10:00:00.000Z' },
            start_time_local: { type: :string, nullable: true },
            last_measurement_value: { type: :integer, nullable: true },
            is_indoor: { type: :boolean },
            latitude: { type: :number, format: :float },
            longitude: { type: :number, format: :float },
            title: { type: :string },
            username: { type: :string, description: 'AirBeam owner username / "anonymous" (indoor); "Government" for Station (government) rows' },
            is_active: { type: :boolean },
            last_hourly_average_value: { type: :number, nullable: true, description: 'AirBeam branch only' },
            streams: {
              type: :object,
              description: 'Keyed by sensor_name',
              additionalProperties: ACTIVE_STREAM_ENTRY,
              example: {
                'AirBeam2-PM2.5' => {
                  measurement_short_type: 'PM', sensor_name: 'AirBeam2-PM2.5',
                  unit_symbol: 'µg/m³', id: 123, stream_daily_average: 12
                },
              },
            },
          },
        },
      },
    },
  }.freeze

  # Fuller per-stream metadata used by the dormant airbeam branch.
  DORMANT_STREAM_ENTRY = {
    type: :object,
    properties: {
      average_value: { type: :number, nullable: true },
      id: { type: :integer },
      max_latitude: { type: :number, format: :float },
      max_longitude: { type: :number, format: :float },
      measurement_short_type: { type: :string },
      measurement_type: { type: :string },
      measurements_count: { type: :integer },
      min_latitude: { type: :number, format: :float },
      min_longitude: { type: :number, format: :float },
      sensor_name: { type: :string },
      sensor_package_name: { type: :string },
      session_id: { type: :integer },
      size: { type: :integer },
      start_latitude: { type: :number, format: :float },
      start_longitude: { type: :number, format: :float },
      threshold_high: { type: :number },
      threshold_low: { type: :number },
      threshold_medium: { type: :number },
      threshold_very_high: { type: :number },
      threshold_very_low: { type: :number },
      unit_name: { type: :string },
      unit_symbol: { type: :string },
    },
  }.freeze

  Q_DESCRIPTION = <<~Q.freeze
    URL-encoded JSON object. Fields:
    required `time_from`, `time_to` (Unix epoch **seconds**), `sensor_name`,
    `measurement_type`, `unit_symbol`, `tags` (string, may be empty),
    `usernames` (string, may be empty); optional `is_indoor` (bool),
    `west`/`east`/`south`/`north` (float), `limit`/`offset`/`zoom_level` (int).
    A `sensor_name` of government-pm2.5 / government-no2 / government-ozone
    returns Station (government) data from the station_streams model.
  Q

  def q_json(sensor_name: 'airbeam2-pm2.5')
    {
      time_from: 1.day.ago.to_i,
      time_to: Time.current.to_i,
      sensor_name: sensor_name,
      measurement_type: 'Particulate Matter',
      unit_symbol: 'µg/m³',
      tags: '',
      usernames: '',
      west: -180.0, east: 180.0, south: -90.0, north: 90.0,
    }.to_json
  end

  path '/api/fixed/active/sessions2.json' do
    get 'Active fixed sessions in a bounding box (AirBeam fixed + Station/government)' do
      tags 'Web app: Fixed sessions'
      produces 'application/json'
      security []
      description "Returns active fixed sessions as map markers. Public (no auth). Response is gzipped.\n\n#{Q_DESCRIPTION}"

      parameter name: :q, in: :query, type: :string, required: true, description: Q_DESCRIPTION

      response '200', 'active sessions' do
        schema ACTIVE_SESSIONS_SCHEMA
        let(:q) { q_json }
        # Doc-only: index2 force-gzips the success body (controller sets
        # HTTP_ACCEPT_ENCODING=gzip), which rswag's JSON-schema validator cannot read.
        skip 'swagger doc: gzipped response body not validatable by rswag'
      end

      response '400', 'validation error (invalid q)' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }
        # Valid epoch times (parsed before the contract) but a required field missing.
        let(:q) do
          {
            time_from: 1.day.ago.to_i, time_to: Time.current.to_i,
            sensor_name: 'airbeam2-pm2.5', measurement_type: 'Particulate Matter',
            tags: '', usernames: '',
          }.to_json
        end
        run_test!
      end
    end
  end

  path '/api/fixed/dormant/sessions.json' do
    get 'Dormant fixed sessions in a bounding box (AirBeam fixed + Station/government)' do
      tags 'Web app: Fixed sessions'
      produces 'application/json'
      security []
      description "Returns dormant (inactive) fixed sessions with full per-stream metadata. Public (no auth).\n\n#{Q_DESCRIPTION}"

      parameter name: :q, in: :query, type: :string, required: true, description: Q_DESCRIPTION

      response '200', 'dormant sessions' do
        schema type: :object,
               required: %w[sessions fetchableSessionsCount],
               properties: {
                 fetchableSessionsCount: { type: :integer, example: 0 },
                 sessions: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       id: { type: :integer },
                       title: { type: :string },
                       start_time_local: { type: :string },
                       end_time_local: { type: :string },
                       is_indoor: { type: :boolean },
                       latitude: { type: :number, format: :float },
                       longitude: { type: :number, format: :float },
                       type: { type: :string, description: 'STI class, e.g. FixedSession' },
                       username: { type: :string },
                       last_hourly_average_value: { type: :number, nullable: true },
                       streams: {
                         type: :object,
                         description: 'Keyed by sensor_name',
                         additionalProperties: DORMANT_STREAM_ENTRY,
                         example: {
                           'AirBeam2-PM2.5' => {
                             average_value: 12, id: 123, sensor_name: 'AirBeam2-PM2.5',
                             sensor_package_name: 'AirBeam2:00189610719F',
                             measurement_type: 'Particulate Matter', measurement_short_type: 'PM',
                             unit_name: 'microgram per cubic meter', unit_symbol: 'µg/m³',
                             measurements_count: 1440, session_id: 456, size: 1440,
                             min_latitude: 40.7, max_latitude: 40.8,
                             min_longitude: -74.01, max_longitude: -73.99,
                             start_latitude: 40.7, start_longitude: -74.0,
                             threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
                             threshold_high: 55, threshold_very_high: 150
                           },
                         },
                       },
                     },
                   },
                 },
               }

        let(:q) { q_json }
        run_test!
      end
    end
  end
end
