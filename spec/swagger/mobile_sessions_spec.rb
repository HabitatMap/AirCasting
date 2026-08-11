require 'swagger_helper'

# Web map: mobile (moving) session list + single mobile stream detail. Legacy model.
RSpec.describe 'Mobile session lists (web)', type: :request do
  MOBILE_STREAM_ENTRY = {
    type: :object,
    properties: {
      average_value: { type: :integer },
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
    URL-encoded JSON object. All fields required: `time_from`, `time_to`
    (Unix epoch **seconds**), `sensor_name`, `measurement_type`, `unit_symbol`,
    `tags` (string, may be empty), `usernames` (string, may be empty),
    `west`, `east`, `south`, `north` (float), `limit`, `offset` (int).
  Q

  path '/api/mobile/sessions.json' do
    get 'Mobile sessions in a bounding box' do
      tags 'Mobile sessions'
      produces 'application/json'
      security []
      description "Returns mobile (moving) sessions with per-stream metadata. Public (no auth).\n\n#{Q_DESCRIPTION}"

      parameter name: :q, in: :query, type: :string, required: true, description: Q_DESCRIPTION

      response '200', 'mobile sessions' do
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
                       type: { type: :string, description: 'STI class, e.g. MobileSession' },
                       username: { type: :string },
                       streams: { type: :object, additionalProperties: MOBILE_STREAM_ENTRY },
                     },
                   },
                 },
               }

        let(:q) do
          {
            time_from: 1.day.ago.to_i, time_to: Time.current.to_i,
            sensor_name: 'airbeam2-pm2.5', measurement_type: 'Particulate Matter',
            unit_symbol: 'µg/m³', tags: '', usernames: '',
            west: -180.0, east: 180.0, south: -90.0, north: 90.0,
            limit: 100, offset: 0,
          }.to_json
        end
        run_test!
      end

      response '400', 'validation error' do
        schema type: :array,
               items: {
                 type: :object,
                 properties: {
                   text: { type: :string, example: 'is missing' },
                   path: { type: :array, items: { type: :string }, example: ['unit_symbol'] },
                 },
               }
        # Valid epoch times (parsed before the contract) but required fields missing.
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

  path '/api/mobile/streams/{id}' do
    get 'Single mobile stream with measurements' do
      tags 'Mobile sessions'
      produces 'application/json'
      security []
      description 'Returns one mobile stream (legacy streams.id) with all its measurements and notes. Public (no auth). Times are epoch milliseconds.'

      parameter name: :id, in: :path, type: :integer, required: true, description: 'Legacy streams.id (mobile)'

      response '200', 'stream found' do
        schema type: :object,
               required: %w[id streamId sensorName title measurements],
               properties: {
                 title: { type: :string },
                 username: { type: :string, description: '"anonymous" for indoor sessions' },
                 sensorName: { type: :string },
                 measurements: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[value time longitude latitude],
                     properties: {
                       value: { type: :number, format: :float },
                       time: { type: :integer, format: :int64, description: 'Epoch milliseconds' },
                       longitude: { type: :number, format: :float },
                       latitude: { type: :number, format: :float },
                     },
                   },
                 },
                 startTime: { type: :integer, format: :int64, nullable: true },
                 endTime: { type: :integer, format: :int64, nullable: true },
                 id: { type: :integer, description: 'Session id' },
                 streamId: { type: :integer },
                 sensorUnit: { type: :string },
                 averageValue: { type: :integer, nullable: true },
                 maxLatitude: { type: :number, format: :float, nullable: true },
                 maxLongitude: { type: :number, format: :float, nullable: true },
                 minLatitude: { type: :number, format: :float, nullable: true },
                 minLongitude: { type: :number, format: :float, nullable: true },
                 startLatitude: { type: :number, format: :float, nullable: true },
                 startLongitude: { type: :number, format: :float, nullable: true },
                 notes: { type: :array, items: { type: :object, additionalProperties: true } },
               }

        let(:session) { create(:mobile_session) }
        let(:stream) { create(:stream, session: session, average_value: 10) }
        let(:id) { stream.id }

        before { create(:measurement, stream: stream) }

        run_test!
      end
    end
  end
end
