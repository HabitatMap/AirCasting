require 'swagger_helper'

# Single AirBeam fixed stream detail (legacy `streams`/`fixed_measurements` model,
# keyed by streams.id). Reused by the web frontend and available to mobile apps.
RSpec.describe 'V3 Fixed streams', type: :request do
  STREAM_DETAIL_SCHEMA = {
    type: :object,
    required: %w[stream measurements stream_daily_averages],
    properties: {
      stream: {
        type: :object,
        required: %w[
          active title latitude longitude profile sensor_name unit_symbol
          update_frequency last_update session_id start_time end_time
          min low middle high max
        ],
        properties: {
          active: { type: :boolean, example: true },
          title: { type: :string, example: 'Rooftop monitor' },
          latitude: { type: :number, format: :float, example: 40.7128 },
          longitude: { type: :number, format: :float, example: -74.006 },
          profile: { type: :string, description: 'Owner username, or "anonymous" for indoor sessions', example: 'jane' },
          sensor_name: { type: :string, example: 'AirBeam-PM2.5' },
          unit_symbol: { type: :string, example: 'µg/m³' },
          update_frequency: { type: :string, example: '1 minute' },
          last_update: { type: :string, format: :'date-time', nullable: true },
          session_id: { type: :integer, description: 'Legacy sessions.id', example: 1234 },
          start_time: { type: :string, format: :'date-time' },
          end_time: { type: :string, format: :'date-time' },
          min: { type: :number, description: 'Threshold very low', example: 0 },
          low: { type: :number, example: 9 },
          middle: { type: :number, example: 35 },
          high: { type: :number, example: 55 },
          max: { type: :number, description: 'Threshold very high', example: 150 },
        },
      },
      measurements: {
        type: :array,
        description: 'Last 2 days of measurements, newest first',
        items: {
          type: :object,
          required: %w[time value],
          properties: {
            time: { type: :integer, format: :int64, description: 'Epoch milliseconds (local-as-UTC)', example: 1_710_000_000_000 },
            value: { type: :number, format: :float, example: 12.5 },
          },
        },
      },
      stream_daily_averages: {
        type: :array,
        description: 'Daily averages for the last 3 full calendar months',
        items: {
          type: :object,
          required: %w[date value],
          properties: {
            date: { type: :string, format: :date, example: '2026-08-01' },
            value: { type: :integer, description: 'Rounded daily average', example: 14 },
          },
        },
      },
    },
  }.freeze

  path '/api/v3/fixed_streams/{id}' do
    get 'Fixed stream detail with recent measurements and daily averages' do
      tags 'Web app: Fixed sessions'
      produces 'application/json'
      security []
      description <<~DESC
        Returns one AirBeam fixed stream (legacy `streams.id`) with the last 2 days of
        measurements and the last 3 full calendar months of daily averages. Public (no auth).

        Times: measurement `time` is epoch **milliseconds** in local-as-UTC (station-local
        wall clock encoded as a UTC epoch). `stream.start_time`/`end_time`/`last_update` are
        ISO 8601 date-times. Station (government) data uses `/api/v3/station_streams/{id}` instead.
      DESC

      parameter name: :id, in: :path, type: :integer, required: true,
                description: 'Legacy streams.id'

      response '200', 'stream found' do
        schema STREAM_DETAIL_SCHEMA

        let(:session) { create(:fixed_session, last_measurement_at: Time.current) }
        let(:stream) do
          create(:stream, :fixed, session: session, sensor_name: 'AirBeam-PM2.5', unit_symbol: 'µg/m³')
        end
        let(:id) { stream.id }

        before do
          create(:threshold_set, :air_beam_pm2_5, :default)
          create(:fixed_measurement, stream: stream, value: 12.5)
          create(:stream_daily_average, stream: stream, date: Date.current, value: 14)
        end

        run_test!
      end
    end
  end
end
