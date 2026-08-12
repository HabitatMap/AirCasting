require 'swagger_helper'

# Measurement time series in an explicit epoch-ms range.
# fixed_measurements -> legacy AirBeam (by streams.id); station_measurements -> gov (by station_streams.id).
RSpec.describe 'V3 Measurements', type: :request do
  MEASUREMENTS_ARRAY_SCHEMA = {
    type: :array,
    items: {
      type: :object,
      required: %w[time value],
      properties: {
        time: { type: :integer, format: :int64, description: 'Epoch milliseconds (local-as-UTC)', example: 1_710_000_000_000 },
        value: { type: :number, format: :float, example: 12.5 },
      },
    },
  }.freeze

  ERRORS_SCHEMA = { type: :object, additionalProperties: true, description: 'Per-field validation errors' }.freeze

  path '/api/v3/fixed_measurements' do
    get 'AirBeam fixed measurements in a time range' do
      tags 'Web app: Fixed sessions'
      produces 'application/json'
      security []
      description <<~DESC
        Returns AirBeam fixed measurements for one legacy stream within `[start_time, end_time]`.
        Public (no auth). `start_time`/`end_time` are epoch **milliseconds** (local-as-UTC).
      DESC

      parameter name: :stream_id, in: :query, type: :string, required: true, description: 'Legacy streams.id'
      parameter name: :start_time, in: :query, required: true, schema: { type: :number, format: :int64 }, description: 'Epoch ms, inclusive'
      parameter name: :end_time, in: :query, required: true, schema: { type: :number, format: :int64 }, description: 'Epoch ms, must be > start_time'

      response '200', 'measurements' do
        schema MEASUREMENTS_ARRAY_SCHEMA

        let(:session) { create(:fixed_session) }
        let(:stream) { create(:stream, :fixed, session: session) }
        let(:now_ms) { Time.current.to_i * 1000 }
        let(:stream_id) { stream.id.to_s }
        let(:start_time) { now_ms - 86_400_000 }
        let(:end_time) { now_ms + 86_400_000 }

        before { create(:fixed_measurement, stream: stream, value: 12.5, time: Time.current) }

        run_test!
      end

      response '400', 'validation error (missing params or end_time <= start_time)' do
        schema ERRORS_SCHEMA

        let(:stream_id) { '1' }
        let(:start_time) { 2 }
        let(:end_time) { 1 }

        run_test!
      end
    end
  end

  path '/api/v3/station_measurements' do
    get 'Station measurements in a time range (government)' do
      tags 'Web app: Station data (government)'
      produces 'application/json'
      security []
      description <<~DESC
        Returns Station (government) `station_measurements` for one `station_stream_id` within
        `[start_time, end_time]`. Public (no auth). `start_time`/`end_time` are epoch
        **milliseconds** in the station-local-as-UTC domain (same convention as AirBeam).
      DESC

      parameter name: :station_stream_id, in: :query, type: :string, required: true, description: 'station_streams.id'
      parameter name: :start_time, in: :query, required: true, schema: { type: :number, format: :int64 }, description: 'Epoch ms, inclusive'
      parameter name: :end_time, in: :query, required: true, schema: { type: :number, format: :int64 }, description: 'Epoch ms, must be > start_time'

      response '200', 'measurements' do
        schema MEASUREMENTS_ARRAY_SCHEMA

        let(:station_stream) { create(:station_stream, time_zone: 'UTC') }
        let(:now_ms) { Time.current.to_i * 1000 }
        let(:station_stream_id) { station_stream.id.to_s }
        let(:start_time) { now_ms - 86_400_000 }
        let(:end_time) { now_ms + 86_400_000 }

        before { create(:station_measurement, station_stream: station_stream, value: 12.5, measured_at: Time.current) }

        run_test!
      end

      response '400', 'validation error' do
        schema ERRORS_SCHEMA

        let(:station_stream_id) { '1' }
        let(:start_time) { 2 }
        let(:end_time) { 1 }

        run_test!
      end
    end
  end
end
