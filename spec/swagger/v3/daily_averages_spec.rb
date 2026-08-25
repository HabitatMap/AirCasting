require 'swagger_helper'

# Daily averages in a date range, for the calendar heatmap.
# fixed_stream_daily_averages -> legacy AirBeam (by streams.id);
# station_stream_daily_averages -> gov (by station_streams.id, param still named stream_id).
RSpec.describe 'V3 Daily averages', type: :request do
  DAILY_AVERAGES_SCHEMA = {
    type: :array,
    items: {
      type: :object,
      required: %w[date value],
      properties: {
        date: { type: :string, format: :date, example: '2026-08-01' },
        value: { type: :integer, description: 'Rounded daily average', example: 14 },
      },
    },
  }.freeze

  path '/api/v3/fixed_stream_daily_averages' do
    get 'AirBeam fixed daily averages in a date range' do
      tags 'Web app: Fixed sessions'
      produces 'application/json'
      security []
      description 'Returns daily averages for one legacy AirBeam stream within [start_date, end_date]. Public (no auth).'

      parameter name: :stream_id, in: :query, type: :integer, required: true, description: 'Legacy streams.id'
      parameter name: :start_date, in: :query, required: true, schema: { type: :string, format: :date }, description: 'YYYY-MM-DD (inclusive)'
      parameter name: :end_date, in: :query, required: true, schema: { type: :string, format: :date }, description: 'YYYY-MM-DD (inclusive)'

      response '200', 'daily averages' do
        schema DAILY_AVERAGES_SCHEMA

        let(:session) { create(:fixed_session) }
        let(:stream) { create(:stream, :fixed, session: session) }
        let(:stream_id) { stream.id }
        let(:start_date) { (Date.current - 7).strftime('%Y-%m-%d') }
        let(:end_date) { Date.current.strftime('%Y-%m-%d') }

        before { create(:stream_daily_average, stream: stream, date: Date.current, value: 14) }

        run_test!
      end
    end
  end

  path '/api/v3/station_stream_daily_averages' do
    get 'Station daily averages in a date range (government)' do
      tags 'Web app: Station data (government)'
      produces 'application/json'
      security []
      description 'Returns Station (government) daily averages for one station_stream within [start_date, end_date]. Public (no auth). Note: the query param is `stream_id` but its value is a `station_streams.id`.'

      parameter name: :stream_id, in: :query, type: :integer, required: true, description: 'station_streams.id (param name is stream_id for frontend parity)'
      parameter name: :start_date, in: :query, required: true, schema: { type: :string, format: :date }, description: 'YYYY-MM-DD (inclusive)'
      parameter name: :end_date, in: :query, required: true, schema: { type: :string, format: :date }, description: 'YYYY-MM-DD (inclusive)'

      response '200', 'daily averages' do
        schema DAILY_AVERAGES_SCHEMA

        let(:station_stream) { create(:station_stream) }
        let(:stream_id) { station_stream.id }
        let(:start_date) { (Date.current - 7).strftime('%Y-%m-%d') }
        let(:end_date) { Date.current.strftime('%Y-%m-%d') }

        before { create(:station_stream_daily_average, station_stream: station_stream, date: Date.current, value: 10) }

        run_test!
      end
    end
  end
end
