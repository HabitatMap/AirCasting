require 'swagger_helper'

# Government (EEA/EPA) single stream detail + CSV export, from the NEW model
# (station_streams / station_measurements), keyed by station_streams.id.
RSpec.describe 'V3 Station streams (government)', type: :request do
  STATION_STREAM_DETAIL_SCHEMA = {
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
          title: { type: :string, example: 'Maputo' },
          latitude: { type: :number, format: :float, example: 50.0 },
          longitude: { type: :number, format: :float, example: 20.0 },
          profile: { type: :string, description: 'Source full name (e.g. "EEA", "US EPA AirNow")', example: 'US EPA AirNow' },
          sensor_name: { type: :string, description: '"Government-" + measurement type', example: 'Government-PM2.5' },
          unit_symbol: { type: :string, example: 'µg/m³' },
          update_frequency: { type: :string, example: '1 hour' },
          last_update: { type: :string, format: :'date-time', nullable: true, description: 'Station-local wall clock (local-as-UTC)' },
          session_id: { type: :integer, description: 'station_streams.id', example: 4827 },
          start_time: { type: :string, format: :'date-time' },
          end_time: { type: :string, format: :'date-time' },
          min: { type: :number, example: 0 },
          low: { type: :number, example: 9 },
          middle: { type: :number, example: 35 },
          high: { type: :number, example: 55 },
          max: { type: :number, example: 150 },
        },
      },
      measurements: {
        type: :array,
        description: 'Last 2 days of station_measurements, newest first',
        items: {
          type: :object,
          required: %w[time value],
          properties: {
            time: { type: :integer, format: :int64, description: 'Epoch milliseconds (station-local as UTC)', example: 1_710_000_000_000 },
            value: { type: :number, format: :float, example: 12.5 },
          },
        },
      },
      stream_daily_averages: {
        type: :array,
        items: {
          type: :object,
          required: %w[date value],
          properties: {
            date: { type: :string, format: :date, example: '2026-08-01' },
            value: { type: :integer, example: 10 },
          },
        },
      },
    },
  }.freeze

  path '/api/v3/station_streams/{id}' do
    get 'Station stream detail (government, new model)' do
      tags 'Web app: Station data (government)'
      produces 'application/json'
      security []
      description <<~DESC
        Returns one Station (government) pollutant stream (`station_streams.id`) from the new model,
        with the last 2 days of `station_measurements` and 3 months of daily averages.
        Public (no auth). A physical Station has one such stream per pollutant
        (PM2.5 / NO2 / Ozone).
      DESC

      parameter name: :id, in: :path, type: :integer, required: true,
                description: 'station_streams.id'

      response '200', 'station stream found' do
        schema STATION_STREAM_DETAIL_SCHEMA

        let(:station_stream) do
          create(:station_stream,
                 first_measured_at: 2.days.ago,
                 last_measured_at: Time.current)
        end
        let(:id) { station_stream.id }

        before do
          create(:station_measurement, station_stream: station_stream, value: 12.5, measured_at: Time.current)
          create(:station_stream_daily_average, station_stream: station_stream, date: Date.current, value: 10)
        end

        run_test!
      end

      response '404', 'station stream not found' do
        schema type: :object, properties: { id: { type: :array, items: { type: :string } } }

        let(:id) { 0 }
        run_test!
      end
    end
  end

  path '/api/v3/station_streams/export' do
    get 'Export Station (government) streams as CSV (emailed)' do
      tags 'Web app: Station data (government)'
      produces 'application/json'
      security []
      description <<~DESC
        Schedules a background CSV export of the given `station_stream_ids` and emails the
        result. Public (no auth). At most #{Api::ExportLimits::STATION_STREAM_IDS_MAX}
        station streams per request.
      DESC

      parameter name: 'station_stream_ids[]', in: :query, required: true,
                schema: { type: :array, items: { type: :integer } },
                style: :form, explode: true,
                description: "station_streams.id list (max #{Api::ExportLimits::STATION_STREAM_IDS_MAX})"
      parameter name: :email, in: :query, type: :string, required: true,
                description: 'Recipient email address'

      response '200', 'export scheduled' do
        schema type: :string, example: 'Export scheduled successfully.'

        let(:station_stream) { create(:station_stream) }
        let(:'station_stream_ids[]') { [station_stream.id] }
        let(:email) { 'user@example.com' }

        run_test!
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }

        let(:'station_stream_ids[]') { [] }
        let(:email) { '' }

        run_test!
      end
    end
  end
end
