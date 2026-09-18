require 'swagger_helper'

# Mobile apps (iOS/Android): mobile session upload, download, sync, update, export.
RSpec.describe 'Mobile app — sessions & sync', type: :request do
  # These endpoints accept HTTP Basic only: user token as the username, a
  # literal `X` as the password. The examples sign in through warden, so this
  # header is what the docs show rather than what the test authenticates with.
  let(:Authorization) { "Basic #{Base64.strict_encode64("#{user.authentication_token}:X")}" }

  # Decoded shape of the `session` payload for uploads (SessionBuilder input).
  SESSION_PAYLOAD = {
    type: :object,
    required: %w[uuid title start_time end_time streams],
    properties: {
      uuid: { type: :string },
      title: { type: :string },
      tag_list: { type: :string, description: 'Space/comma separated' },
      contribute: { type: :boolean },
      is_indoor: { type: :boolean },
      deleted: { type: :boolean },
      version: { type: :integer },
      latitude: { type: :number, format: :float },
      longitude: { type: :number, format: :float },
      start_time: { type: :string, description: 'ISO 8601' },
      end_time: { type: :string, description: 'ISO 8601' },
      time_zone: { type: :string, nullable: true, description: 'IANA tz; derived from lat/lng if omitted' },
      notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
      streams: {
        type: :object,
        description: 'Keyed by sensor name',
        example: {
          'AirBeam2-PM2.5' => {
            sensor_name: 'AirBeam2-PM2.5', sensor_package_name: 'AirBeam2:00189610719F',
            measurement_type: 'Particulate Matter', measurement_short_type: 'PM',
            unit_name: 'microgram per cubic meter', unit_symbol: 'µg/m³',
            threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
            threshold_high: 55, threshold_very_high: 150, deleted: false,
            measurements: [{ time: '2026-08-12T10:00:00.000Z', value: 12.5, latitude: 40.7, longitude: -74.0, milliseconds: 0 }]
          },
        },
        additionalProperties: {
          type: :object,
          properties: {
            sensor_name: { type: :string },
            sensor_package_name: { type: :string },
            measurement_type: { type: :string },
            measurement_short_type: { type: :string },
            unit_name: { type: :string },
            unit_symbol: { type: :string },
            threshold_very_low: { type: :number },
            threshold_low: { type: :number },
            threshold_medium: { type: :number },
            threshold_high: { type: :number },
            threshold_very_high: { type: :number },
            deleted: { type: :boolean },
            measurements: {
              type: :array,
              items: {
                type: :object,
                properties: {
                  time: { type: :string, description: 'ISO 8601' },
                  value: { type: :number },
                  latitude: { type: :number, format: :float },
                  longitude: { type: :number, format: :float },
                  milliseconds: { type: :integer },
                },
              },
            },
          },
        },
      },
    },
  }.freeze

  UPLOAD_RESPONSE = {
    type: :object,
    required: %w[location notes],
    properties: {
      location: { type: :string, description: 'Short session URL' },
      notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
    },
  }.freeze

  path '/api/sessions' do
    post 'Upload a mobile session' do
      tags 'Mobile app: Mobile sessions [DEPRECATED]'
      deprecated true
      security [{ basic_auth: [] }]
      consumes 'multipart/form-data'
      produces 'application/json'
      description <<~DESC
        **Deprecated** — use `POST /api/v3/mobile_sessions` plus
        `POST /api/v3/mobile_sessions/{uuid}/measurements`.

        Uploading the same `uuid` twice concurrently yields one session; both callers
        receive the same `location`. A `uuid` that already existed before the request
        is a bodiless `400`.
      DESC

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          session: { type: :string, description: 'JSON (see decoded shape). Raw when compression unset; Base64+gzip when set.' },
          compression: { type: :boolean, description: 'When true, `session` is Base64-encoded gzip.' },
          photos: { type: :array, items: { type: :string }, description: 'Sent as `photos[]`. Base64 images, index-paired with the notes in `session`.' },
          decoded_session: SESSION_PAYLOAD, # documentation only — the decoded `session`
        },
      }

      response '200', 'created' do
        schema UPLOAD_RESPONSE
        # Doc-only: exercising SessionBuilder needs a full valid gzip/JSON payload;
        # documented here without a live request.
        skip 'swagger doc: upload payload not exercised live'
      end

      response '400', 'invalid payload, or uuid already in use' do
        # No body: the controller answers `head :bad_request`.
        skip 'swagger doc: upload payload not exercised live'
      end
    end
  end

  path '/api/user/sessions/empty.json' do
    get 'Download session metadata by UUID (optionally with measurements)' do
      tags 'Mobile app: Mobile sessions [DEPRECATED]'
      deprecated true
      security [{ basic_auth: [] }]
      produces 'application/json'
      description <<~DESC
        **Deprecated** — use `GET /api/v3/mobile_sessions/{uuid}`.

        The `empty` path segment is a placeholder; the session is selected by the
        `uuid` query param.
      DESC

      parameter name: :uuid, in: :query, type: :string, required: true
      parameter name: :stream_measurements, in: :query, type: :string, required: false, description: '"true" to embed measurements'

      response '200', 'session metadata' do
        schema type: :object,
               description: 'Session metadata plus derived keys',
               properties: {
                 uuid: { type: :string },
                 title: { type: :string },
                 type: { type: :string, example: 'MobileSession' },
                 start_time: { type: :string },
                 end_time: { type: :string },
                 location: { type: :string },
                 tag_list: { type: :string },
                 notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
                 streams: { type: :object, description: 'Keyed by sensor_name', example: { 'AirBeam2-PM2.5' => { id: 123, sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³', measurement_type: 'Particulate Matter', measurement_short_type: 'PM', unit_name: 'microgram per cubic meter', size: 1440, threshold_very_low: 0, threshold_low: 9, threshold_medium: 35, threshold_high: 55, threshold_very_high: 150 } }, additionalProperties: { type: :object, additionalProperties: true } },
               }

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user, uuid: 'sync-uuid-1') }
        let(:uuid) { session.uuid }
        let(:stream_measurements) { 'false' }
        before { create(:stream, session: session); sign_in user }
        run_test!
      end
    end
  end

  path '/api/user/sessions/sync_with_versioning.json' do
    post 'Sync sessions (diff of what to upload/download/delete)' do
      tags 'Mobile app: Mobile sessions [DEPRECATED]'
      deprecated true
      security [{ basic_auth: [] }]
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        **Deprecated** — use `GET /api/v3/mobile_sessions`, which is authoritative:
        a session the client holds but never sees while paging has been deleted.
      DESC

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[data],
        properties: {
          data: {
            type: :string,
            description: 'JSON array string: [{uuid, deleted(bool), version(int)}]',
            example: '[{"uuid":"abc","deleted":false,"version":3}]',
          },
        },
      }

      response '200', 'sync diff' do
        schema type: :object,
               required: %w[upload download deleted],
               properties: {
                 upload: { type: :array, items: { type: :string } },
                 download: { type: :array, items: { type: :string } },
                 deleted: { type: :array, items: { type: :string } },
               }
        let(:user) { create(:user) }
        let(:body) { { data: '[]' } }
        before { sign_in user }
        run_test!
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: true,
               description: 'Per-item validation errors keyed by array index',
               example: { data: { '0' => { deleted: ['is missing'], version: ['is missing'] } } }
        let(:user) { create(:user) }
        let(:body) { { data: '[{"uuid":"x"}]' } }
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/api/user/sessions/update_session.json' do
    post 'Update a session (rename, tags, notes, delete streams)' do
      tags 'Mobile app: Mobile sessions [DEPRECATED]'
      deprecated true
      security [{ basic_auth: [] }]
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        **Deprecated** — use `PATCH /api/v3/mobile_sessions/{uuid}` for title and
        tags, and the `/notes` endpoints for notes.

        Bumps the session version. Streams flagged `deleted: true` are removed,
        matched by `sensor_name` + `sensor_package_name`. A uuid owned by another
        user answers `400`, exactly as an unknown uuid does.
      DESC

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[data],
        properties: {
          data: {
            type: :string,
            description: 'JSON string: {uuid, title, tag_list, notes:[{number,text}], streams:{"<name>":{sensor_name,sensor_package_name,deleted}}}',
          },
        },
      }

      response '200', 'updated session' do
        schema type: :object,
               properties: {
                 uuid: { type: :string },
                 title: { type: :string },
                 tag_list: { type: :string },
                 version: { type: :integer },
                 type: { type: :string },
                 notes: { type: :array, items: { type: :object, properties: { id: { type: :integer }, text: { type: :string }, date: { type: :string }, latitude: { type: :number, format: :float }, longitude: { type: :number, format: :float }, photo: { type: :string, nullable: true }, photo_thumbnail: { type: :string, nullable: true }, photo_location: { type: :string, nullable: true }, number: { type: :integer } } } },
                 streams: { type: :object, description: 'Keyed by sensor_name', example: { 'AirBeam2-PM2.5' => { id: 123, sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³', measurement_type: 'Particulate Matter', measurement_short_type: 'PM', unit_name: 'microgram per cubic meter', size: 1440, threshold_very_low: 0, threshold_low: 9, threshold_medium: 35, threshold_high: 55, threshold_very_high: 150 } }, additionalProperties: { type: :object, additionalProperties: true } },
               }
        # Doc-only: requires a pre-existing session + streams matching the payload.
        skip 'swagger doc: update payload not exercised live'
      end

      response '400', 'unknown uuid, a uuid owned by another user, or a validation error' do
        # Two shapes, because the controller renders whatever the Failure carries:
        # a contract failure serializes the dry-validation messages as an array of
        # objects, while a missing session is a bare string — the body is the
        # sentence itself, not a JSON object wrapping it.
        schema oneOf: [
                 { type: :array,
                   description: 'dry-validation messages',
                   items: { type: :object, additionalProperties: true },
                   example: [{ text: 'is missing', path: ['title'] }] },
                 { type: :string, example: "Session with uuid: 1234 doesn't exist" },
               ]
        let(:user) { create(:user) }
        # `streams` is required even to reach validation — the contract's before hook
        # derives streams_to_delete from it. `title` is the field left missing here.
        let(:body) { { data: { uuid: 'abc', tag_list: '', notes: [], streams: {} }.to_json } }
        before { sign_in user }
        run_test!
      end
    end
  end
end
