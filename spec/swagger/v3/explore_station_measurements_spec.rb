require 'swagger_helper'

RSpec.describe 'Explore station measurements', type: :request do
  path '/api/v3/explore/stations/{uuid}/measurements' do
    get '[ALPHA] Measurements for one stream of a public station' do
      tags 'Mobile app: Explore map'
      produces 'application/json'
      security []
      description <<~DESC
        The readings behind one stream of public station (GOV or AirBeam)

        Read the names from `streams[].sensor_name` on the station detail. Omit the
        window to get the last 6 hours, anchored on the station's last reading — so a station
        that went quiet still answers with its final hours rather than an empty array.

        **Timestamps are real UTC instants**, milliseconds in JSON — render local with the `time_zone` the station detail returns.

        ## Error codes

        | `error_code` | HTTP | When |
        |---|---|---|
        | `validation_error` | 400 | Missing `sensor_name`, half a window, `end_time <= start_time`, a window over 12h, or a non-integer time. `fields` names the offending parameter. Answered **before** the uuid lookup |
        | `not_found` | 404 | No public station with this uuid — private, indoor, excluded and unknown are deliberately indistinguishable — **or** the station has no stream with this `sensor_name`. The `message` tells the two apart; the code does not |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'The `uuid` of an item returned by `GET /api/v3/explore/map`'
      parameter name: :sensor_name, in: :query, required: true, schema: { type: :string },
                description: 'The one stream to read, as `GET /api/v3/explore/stations/{uuid}` ' \
                             'spells it — e.g. `AirBeam-PM2.5` or `Government-PM2.5`.'
      parameter name: :start_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms, UTC. Send with end_time; omit both for the last 6h.'
      parameter name: :end_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms, UTC. At most 12h after start_time.'

      response '200', 'measurements for the named stream, oldest first' do
        schema type: :array,
               items: {
                 type: :object,
                 required: %w[time value],
                 properties: {
                   time: {
                     type: :integer, format: :int64,
                     description: 'Epoch milliseconds, UTC — a real instant, not local time',
                   },
                   value: {
                     type: :number,
                     description: 'The raw reading, unrounded. Unlike the station detail, which ' \
                                  'rounds the numbers it draws',
                   },
                 },
               },
               example: [
                 { time: 1_786_707_000_000, value: 12.5 },
               ]

        let(:measured_at) { Time.utc(2026, 8, 14, 11, 30, 0) }
        let(:session_record) do
          create(
            :fixed_session,
            contribute: true, is_indoor: false,
            time_zone: 'America/New_York',
            last_measurement_at: Time.utc(2026, 8, 14, 12, 0, 0),
          )
        end
        let(:uuid) { session_record.uuid }
        let(:sensor_name) { 'AirBeam-PM2.5' }

        before do
          stream = create(:stream, :fixed, session: session_record, sensor_name: 'AirBeam-PM2.5')
          create(:fixed_measurement, stream: stream, value: 12.5,
                 time: measured_at, time_with_time_zone: measured_at)
        end

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq(
            [{ 'time' => measured_at.to_i * 1_000, 'value' => 12.5 }],
          )
        end
      end

      response '400', 'missing sensor_name, or a window over 12 hours' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Query is invalid' },
                 fields: ERROR_FIELDS_SCHEMA.merge(
                   example: { sensor_name: [{ code: 'missing', message: 'is missing' }] },
                 ),
               }

        let(:uuid) { '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b' }
        let(:sensor_name) { nil }
        run_test!
      end

      response '404', 'no public station with this uuid, or no such stream on it' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'not_found' },
                 message: { type: :string, example: 'Station not found' },
               }

        let(:uuid) { '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b' }
        let(:sensor_name) { 'Government-PM2.5' }
        run_test!
      end
    end
  end
end
