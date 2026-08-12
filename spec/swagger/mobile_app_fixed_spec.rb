require 'swagger_helper'

# Mobile apps (iOS/Android): fixed map + session/stream detail. All public (no auth).
RSpec.describe 'Mobile app — fixed map & streams', type: :request do
  FIXED_STREAM_ENTRY = {
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

  path '/api/fixed/active/sessions.json' do
    get 'Active fixed sessions in a bounding box' do
      tags 'Mobile app: Fixed map & streams'
      produces 'application/json'
      security []
      description <<~DESC
        Returns active fixed sessions with per-stream metadata. Public (no auth).
        `q` is URL-encoded JSON: required `time_from`, `time_to` (Unix epoch **seconds**),
        `sensor_name`, `measurement_type`, `unit_symbol`, `tags` (may be empty),
        `usernames` (may be empty); optional `is_indoor` (bool), `west`/`east`/`south`/`north`
        (float), `limit`/`offset`/`zoom_level` (int).
      DESC

      parameter name: :q, in: :query, type: :string, required: true, description: 'URL-encoded JSON filter'

      response '200', 'active sessions' do
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
                       uuid: { type: :string },
                       title: { type: :string },
                       start_time_local: { type: :string },
                       end_time_local: { type: :string },
                       last_hour_average: { type: :number, nullable: true },
                       is_indoor: { type: :boolean },
                       latitude: { type: :number, format: :float },
                       longitude: { type: :number, format: :float },
                       type: { type: :string },
                       username: { type: :string },
                       streams: {
                         type: :object,
                         description: 'Keyed by sensor_name',
                         additionalProperties: FIXED_STREAM_ENTRY,
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

  path '/api/fixed/sessions/{id}/streams.json' do
    get 'Fixed session with all its streams and measurements' do
      tags 'Mobile app: Fixed map & streams'
      produces 'application/json'
      security []
      description 'Returns one fixed session (sessions.id) with every stream and its measurements. Public (no auth). Times are epoch milliseconds.'

      parameter name: :id, in: :path, type: :integer, required: true, description: 'sessions.id'
      parameter name: :measurements_limit, in: :query, type: :integer, required: false, description: 'Max measurements per stream'

      response '200', 'session with streams' do
        schema type: :object,
               required: %w[id title streams],
               properties: {
                 id: { type: :integer },
                 title: { type: :string },
                 username: { type: :string },
                 start_time: { type: :integer, format: :int64, description: 'Epoch ms' },
                 end_time: { type: :integer, format: :int64 },
                 latitude: { type: :number, format: :float },
                 longitude: { type: :number, format: :float },
                 is_indoor: { type: :boolean },
                 notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       stream_id: { type: :integer },
                       sensor_name: { type: :string },
                       last_measurement_value: { type: :number, nullable: true },
                       max_latitude: { type: :number, format: :float, nullable: true },
                       max_longitude: { type: :number, format: :float, nullable: true },
                       min_latitude: { type: :number, format: :float, nullable: true },
                       min_longitude: { type: :number, format: :float, nullable: true },
                       sensor_unit: { type: :string },
                       unit_name: { type: :string },
                       measurement_short_type: { type: :string },
                       measurement_type: { type: :string },
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
                             value: { type: :number },
                             time: { type: :integer, format: :int64, description: 'Epoch ms' },
                             latitude: { type: :number, format: :float },
                             longitude: { type: :number, format: :float },
                           },
                         },
                       },
                     },
                   },
                 },
               }

        let(:session) { create(:fixed_session, last_measurement_at: Time.current) }
        let(:stream) { create(:stream, :fixed, session: session) }
        let(:id) { session.id }
        before { create(:fixed_measurement, stream: stream) }
        run_test!
      end
    end
  end

  path '/api/fixed/streams/{id}.json' do
    get 'Single fixed stream with measurements' do
      tags 'Mobile app: Fixed map & streams'
      produces 'application/json'
      security []
      description 'Returns one fixed stream (streams.id) with its measurements and notes. Public (no auth). Times are epoch milliseconds.'

      parameter name: :id, in: :path, type: :integer, required: true, description: 'streams.id (fixed)'
      parameter name: :measurements_limit, in: :query, type: :integer, required: false

      response '200', 'stream found' do
        schema type: :object,
               required: %w[id streamId sensorName measurements],
               properties: {
                 title: { type: :string },
                 username: { type: :string },
                 sensorName: { type: :string },
                 measurements: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       value: { type: :number },
                       time: { type: :integer, format: :int64 },
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
                 latitude: { type: :number, format: :float, nullable: true },
                 longitude: { type: :number, format: :float, nullable: true },
                 maxLatitude: { type: :number, format: :float, nullable: true },
                 maxLongitude: { type: :number, format: :float, nullable: true },
                 minLatitude: { type: :number, format: :float, nullable: true },
                 minLongitude: { type: :number, format: :float, nullable: true },
                 notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
                 isIndoor: { type: :boolean },
                 lastMeasurementValue: { type: :number, nullable: true },
                 threshold_very_low: { type: :number },
                 threshold_low: { type: :number },
                 threshold_medium: { type: :number },
                 threshold_high: { type: :number },
                 threshold_very_high: { type: :number },
                 unit_name: { type: :string },
                 measurement_short_type: { type: :string },
                 measurement_type: { type: :string },
               }

        let(:session) { create(:fixed_session, last_measurement_at: Time.current) }
        let(:stream) { create(:stream, :fixed, session: session) }
        let(:id) { stream.id }
        run_test!
      end
    end
  end
end
