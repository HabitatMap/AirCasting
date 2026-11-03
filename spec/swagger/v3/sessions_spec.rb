require 'swagger_helper'

# Sessions by device id, tags and date range. Public; called by external data
# pipelines, not by the apps or the web frontend.
#
# The device id is not a column: it is the part of `streams.sensor_package_name`
# after the first `:` or `-`. Firmware writes it in one case only — lowercase
# before AirBeam Mini FW 1.0.0, uppercase since — so the interactor matches
# both, as exact values, to stay on `index_streams_on_sensor_package_name`.
module SessionsByDeviceDocs
  SESSION = {
    type: :object,
    required: %w[id title start_datetime end_datetime type streams],
    properties: {
      id: { type: :integer, example: 1977171 },
      title: { type: :string, example: 'Yaba Hub' },
      start_datetime: {
        type: :string,
        description: 'Wall clock where the session was recorded, no offset',
        example: '2026-10-27T19:24:00',
      },
      end_datetime: {
        type: :string,
        description: 'Wall clock where the session was recorded, no offset',
        example: '2026-10-27T20:10:00',
      },
      type: { type: :string, enum: %w[MobileSession FixedSession] },
      streams: {
        type: :array,
        description:
          'With `sensor_package_name`, only the streams of that device; ' \
          'otherwise every stream of the session.',
        items: {
          type: :object,
          required: %w[id sensor_name measurement_type],
          properties: {
            id: { type: :integer },
            sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
            measurement_type: { type: :string, example: 'Particulate Matter' },
          },
        },
      },
    },
  }.freeze
end

RSpec.describe 'Data access — sessions by device', type: :request do
  path '/api/v3/sessions' do
    get 'Sessions by device, tags and date range' do
      tags 'Data access: Sessions'
      produces 'application/json'
      security []
      description 'Not paginated and in no guaranteed order — narrow the ' \
                  'window rather than page. Sessions without streams are never returned.'

      parameter name: :sensor_package_name, in: :query, type: :string, required: false,
                description: '`<Model>:<device id>`, e.g. `AirBeamMini:CC8DA2692E7C`. ' \
                             'The device id matches in lowercase or uppercase; the rest ' \
                             'matches exactly. `:` and `-` are different values: live ' \
                             'Bluetooth recordings are stored as `AirBeam3:<id>`, fixed ' \
                             'sessions over WiFi and SD-card syncs as `AirBeam3-<id>` — ' \
                             'query both for all of a device\'s sessions.'
      parameter name: :start_datetime, in: :query, required: false,
                schema: { type: :string, format: :'date-time' },
                description: 'Compared with the session start, in the wall clock where ' \
                             'it was recorded. Default: start of the day 30 days ago'
      parameter name: :end_datetime, in: :query, required: false,
                schema: { type: :string, format: :'date-time' },
                description: 'Same clock as `start_datetime`. Default: end of today'
      parameter name: 'tags[]', in: :query, required: false,
                schema: { type: :array, items: { type: :string } },
                style: :form, explode: true,
                description: 'Sessions carrying any of these tags'

      response '200', 'matching sessions' do
        schema type: :object,
               required: %w[sessions],
               properties: {
                 sessions: { type: :array, items: SessionsByDeviceDocs::SESSION },
               }

        let!(:v1_session) do
          create(:mobile_session, start_time_local: 3.days.ago).tap do |session|
            create(:stream, session: session,
                            sensor_package_name: 'AirBeamMini:cc8da2692e7c')
          end
        end
        let!(:v2_session) do
          create(:mobile_session, start_time_local: 1.day.ago).tap do |session|
            create(:stream, session: session,
                            sensor_package_name: 'AirBeamMini:CC8DA2692E7C')
            create(:stream, session: session, sensor_package_name: 'Builtin')
          end
        end
        let!(:other_device_session) do
          create(:mobile_session, start_time_local: 1.day.ago).tap do |session|
            create(:stream, session: session,
                            sensor_package_name: 'AirBeamMini:CC8DA26B0768')
          end
        end

        let(:sensor_package_name) { 'AirBeamMini:cc8da2692e7c' }
        let(:start_datetime) { 7.days.ago.strftime('%Y-%m-%dT%H:%M:%S') }
        let(:end_datetime) { Time.current.strftime('%Y-%m-%dT%H:%M:%S') }

        run_test! do |response|
          sessions = JSON.parse(response.body)['sessions']

          expect(sessions.map { |s| s['id'] }).to contain_exactly(
            v1_session.id, v2_session.id,
          )
          v2 = sessions.find { |s| s['id'] == v2_session.id }
          expect(v2['streams'].size).to eq(1)
        end
      end

      response '400', 'invalid query parameters' do
        schema type: :object,
               required: %w[error_code message fields],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: ERROR_FIELDS_SCHEMA.merge(
                   example: {
                     end_datetime: [
                       { code: 'greater_than',
                         message: 'must be greater than start_datetime',
                         params: { other: 'start_datetime' } },
                     ],
                   },
                 ),
               }

        let(:start_datetime) { '2025-01-15T00:00' }
        let(:end_datetime) { '2025-01-10T00:00' }

        run_test!
      end
    end
  end
end
