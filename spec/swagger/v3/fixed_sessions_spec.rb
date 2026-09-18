require 'swagger_helper'

RSpec.describe 'AirBeamMini Fixed Sessions Binary Flow', type: :request do
  def build_measurement_binary(type_id:, epoch: Time.current.to_i, value: 12.5)
    header = ["\xAB\xBA", 1].pack('a2n')
    measurement = [epoch, type_id, value].pack('NCg')
    payload = header + measurement
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  ERROR_SCHEMA = {
    type: :object,
    required: %w[error_code message],
    properties: {
      error_code: { type: :string },
      message: { type: :string }
    }
  }.freeze

  path '/api/v3/fixed_sessions' do
    get "List the signed-in user's fixed sessions" do
      tags 'Mobile app: Fixed sessions'
      produces 'application/json'
      description <<~DESC
        Ordered by creation, oldest first.

        The list is authoritative: walk it to the last page, and a session the
        client holds locally but never saw has been deleted server-side.

        A `page` past the end answers `200` with an empty `sessions` array.

        No measurement history and no `session_token` — a stream carries only its
        newest reading (`last_measurement`), and history is read from
        `GET /api/v3/fixed_streams/{id}` and the measurement endpoints.

        A sensor is dormant once `last_measurement_at` is more than 24 hours old.

        | `error_code` | HTTP | When |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid token |
        | `validation_error` | 400 | `page` or `per_page` out of range or not a number |
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'
      parameter name: :page, in: :query, required: false,
                schema: { type: :integer, minimum: 1, default: 1 },
                description: '1-based page number'
      parameter name: :per_page, in: :query, required: false,
                schema: {
                  type: :integer,
                  minimum: 1,
                  maximum: Api::ListFixedSessionsContract::MAX_PER_PAGE,
                  default: FixedSessions::List::DEFAULT_PER_PAGE,
                },
                description: "Page size, 1..#{Api::ListFixedSessionsContract::MAX_PER_PAGE}"

      response '200', 'sessions' do
        schema type: :object,
               required: %w[sessions meta],
               properties: {
                 meta: {
                   type: :object,
                   description: 'Describes the whole collection, not the returned page',
                   required: %w[total page per_page total_pages],
                   properties: {
                     total: { type: :integer, example: 3,
                              description: 'Total fixed sessions the user owns' },
                     page: { type: :integer, example: 1 },
                     per_page: { type: :integer, example: 500 },
                     total_pages: { type: :integer, example: 1,
                                    description: '0 when the user owns no sessions' },
                   },
                 },
                 sessions: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       uuid: { type: :string },
                       title: { type: :string },
                       type: { type: :string, example: 'FixedSession' },
                       tag_list: { type: :string, example: 'rooftop, pm' },
                       contribute: { type: :boolean },
                       is_indoor: { type: :boolean },
                       time_zone: { type: :string, example: 'America/New_York',
                                    description: 'IANA zone at the sensor; render every timestamp below in it' },
                       start_time: { type: :integer, format: :int64, nullable: true, example: 1_786_663_800_000,
                                     description: 'Epoch ms (UTC)' },
                       end_time: { type: :integer, format: :int64, nullable: true, example: 1_786_707_000_000 },
                       last_measurement_at: { type: :integer, format: :int64, nullable: true, example: 1_786_707_000_000,
                                              description: 'Epoch ms (UTC); null until the sensor first reports' },
                       version: { type: :integer },
                       latitude: { type: :number, format: :float, example: 40.7128,
                                   description: 'Indoor sessions carry the placeholder 200' },
                       longitude: { type: :number, format: :float, example: -74.006 },
                       share_url: { type: :string, example: 'https://aircasting.org/s/ab12c',
                                    description: 'Capability link; append `?sensor_name=<stream>` to open it' },
                       device: {
                         type: :object, nullable: true,
                         properties: {
                           mac_address: { type: :string },
                           model: { type: :string },
                           name: { type: :string, nullable: true }
                         }
                       },
                       streams: {
                         type: :object,
                         description: 'Keyed by sensor_name. `sensor_type_id` is the handle the binary ' \
                                      'measurements upload addresses the stream by, and is `null` on a ' \
                                      'session created before this API group existed — decode it as nullable. ' \
                                      '`last_measurement` is `null` for a stream that has never reported.',
                         additionalProperties: { type: :object, additionalProperties: true },
                         example: {
                           'AirBeamMini-PM2.5' => {
                             sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2,
                             sensor_package_name: 'AirBeamMini:aa:bb:cc:dd:ee:ff',
                             measurement_type: 'Particulate Matter', measurement_short_type: 'PM',
                             unit_name: 'microgram per cubic meter', unit_symbol: 'µg/m³',
                             last_measurement: { value: 12.5, time: 1_786_707_000_000 },
                             threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
                             threshold_high: 55, threshold_very_high: 150
                           }
                         }
                       }
                     }
                   },
                 },
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        before do
          session = create(:fixed_session, user: user)
          stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
          create(:fixed_measurement, stream: stream)
        end
        run_test!
      end

      response '400', 'invalid pagination parameters' do
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:per_page) { 0 }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end

    post 'Create a new AirBeamMini fixed session' do
      tags 'Mobile app: Fixed sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creating the same `uuid` twice concurrently yields one session; both callers
        are answered with it, its token and its streams. A `uuid` that already existed
        before the request is `session_uuid_taken`.

        ## Error codes

        `{ error_code, message, fields? }`, as everywhere in v3. `fields` appears only
        when the request shape is wrong.

        | `error_code` | HTTP | When | Client should |
        |---|---|---|---|
        | `unauthorized` | 401 | Missing or invalid token | Re-authenticate |
        | `validation_error` | 400 | Malformed body, or a stream with no `thresholds` and no seeded default | Do not retry unchanged |
        | `session_uuid_taken` | 409 | The `uuid` is already in use | Stop retrying; continue with the existing session |
        | `unsupported_sensor_type` | 400 | A `sensor_name` is not a known AirBeam sensor | Unrecoverable |
        | `try_again_later` | 503 | Temporarily unavailable | Retry after the `Retry-After` header (seconds) |
        | `internal_error` | 500 | Unexpected server error | Retry with backoff |
      DESC

      # The only operation that still accepts the deprecated Basic scheme:
      # Android 4.0.0-4.0.5 and the iOS AirBeamMini V2 build already post it.
      security [{ bearer_auth: [] }, { basic_auth: [] }]

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: '`Bearer <user_token>`.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[uuid title latitude longitude contribute device streams],
        properties: {
          uuid: { type: :string, format: :uuid, example: '550e8400-e29b-41d4-a716-446655440000',
                  description: 'Canonical UUID form; must not already be in use.' },
          title: { type: :string, example: 'Rooftop PM2.5 monitor' },
          latitude: { type: :number, format: :float, example: 40.7128 },
          longitude: { type: :number, format: :float, example: -74.0060 },
          contribute: { type: :boolean, example: true,
                        description: 'Required — send it explicitly; the server applies no default.' },
          is_indoor: { type: :boolean, nullable: true, example: false,
                       description: 'Whether the sensor is deployed indoors. Defaults to false when omitted.' },
          time_zone: {
            type: :string,
            nullable: true,
            example: 'America/New_York',
            description: 'IANA time zone identifier of the sensor location. Required for indoor sessions, which send placeholder coordinates (200, 200); used to convert UTC measurement timestamps to local time for display. When omitted, the time zone is derived from latitude/longitude.'
          },
          device: {
            type: :object,
            required: %w[mac_address model],
            description: 'Shipped app versions may still send this object under the key `airbeam`.',
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF',
                             description: 'Any stable device id — not necessarily a hardware MAC.' },
              model: { type: :string, example: 'AirBeamMini', description: 'Free-form model name.' },
              name: { type: :string, nullable: true, example: 'Roof sensor' }
            }
          },
          streams: {
            type: :array,
            minItems: 1,
            description: 'One per sensor type. `AirBeamMini-PM2.5` and `AirBeam2-PM2.5` are the same ' \
                         'type (`AirBeam-PM2.5`) and cannot both be requested.',
            items: {
              type: :object,
              required: %w[sensor_name unit_symbol],
              properties: {
                sensor_name: {
                  type: :string,
                  description: 'Sensor name as reported by the device (e.g. AirBeamMini-PM1, AirBeamMini-PM2.5)',
                  example: 'AirBeamMini-PM2.5'
                },
                unit_symbol: {
                  type: :string,
                  description: 'Unit symbol for this sensor (e.g. µg/m³, %, F)',
                  example: 'µg/m³'
                }
              }
            },
            example: [
              { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }
            ]
          }
        }
      }

      response '201', 'session created' do
        schema type: :object,
               required: %w[location share_url session_token streams],
               properties: {
                 location: {
                   type: :string,
                   example: 'http://aircasting.org/s/ab12c',
                   description: 'LEGACY alias of `share_url`, read by shipped app versions. Kept indefinitely; new clients should use `share_url`.'
                 },
                 share_url: {
                   type: :string,
                   example: 'http://aircasting.org/s/ab12c',
                   description: 'Shareable session link (`<host>/s/<token>`). Append `?sensor_name=<stream>` before sharing — the link only resolves with that query parameter.'
                 },
                 session_token: {
                   type: :string,
                   description: 'Bearer token for AirBeam measurement uploads. The mobile app passes this to the AirBeam over BLE after session creation.',
                   example: 'a3f2c1d4e5b6a7f8c9d0e1f2a3b4c5d6'
                 },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[sensor_name sensor_type_id],
                     properties: {
                       sensor_name: { type: :string, example: 'AirBeam-PM2.5' },
                       sensor_type_id: {
                         type: :integer,
                         description: 'Compact numeric ID used by the AirBeam in the binary upload format to identify this stream',
                         example: 2
                       }
                     }
                   }
                 }
               }

        before(:all) do
          @ts_pm1 = FactoryBot.create(:threshold_set, :air_beam_pm1, :default)
          @ts_pm2_5 = FactoryBot.create(:threshold_set, :air_beam_pm2_5, :default)
        end

        after(:all) do
          @ts_pm1&.destroy
          @ts_pm2_5&.destroy
        end

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) do
          {
            uuid: SecureRandom.uuid,
            title: 'Rooftop PM2.5 monitor',
            latitude: 40.7128,
            longitude: -74.0060,
            contribute: true,
            device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
            streams: [
              { sensor_name: 'AirBeamMini-PM1', unit_symbol: 'µg/m³' },
              { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }
            ]
          }
        end


        run_test!
      end

      response '400', 'validation error' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: {
                   type: :object,
                   description: 'Per-field validation errors',
                   additionalProperties: { type: :array, items: { type: :string } },
                   example: { uuid: ['is missing'], streams: ['is missing'] }
                 }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { { uuid: '' } }


        run_test!
      end

      response '409', 'uuid already in use' do
        schema ERROR_SCHEMA

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let!(:existing) { create(:fixed_session, user: user, uuid: SecureRandom.uuid) }
        let(:body) do
          {
            uuid: existing.uuid,
            title: 'Rooftop PM2.5 monitor',
            latitude: 40.7128,
            longitude: -74.0060,
            contribute: true,
            device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
            streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }]
          }
        end


        run_test! do |response|
          expect(JSON.parse(response.body)['error_code']).to eq('session_uuid_taken')
        end
      end

      # Stubbed: the conditions behind internal_error are an unresolvable write
      # conflict and a rival create still holding the uuid, neither of which a
      # single-threaded request spec can produce. The mapping itself is what this
      # documents; FixedSessions::Creator's own spec covers when it is returned.
      response '500', 'session could not be created' do
        schema ERROR_SCHEMA

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) do
          {
            uuid: SecureRandom.uuid,
            title: 'Rooftop PM2.5 monitor',
            latitude: 40.7128,
            longitude: -74.0060,
            contribute: true,
            device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
            streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }]
          }
        end

        before do
          allow_any_instance_of(FixedSessions::Creator).to receive(:call).and_return(
            Failure.new(
              error_code: FixedSessions::BinaryProtocol::ErrorCodes::INTERNAL_ERROR,
              message: 'Could not create this session',
            ),
          )
        end

        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:Authorization) { 'Bearer invalid' }
        let(:body) { {} }

        run_test!
      end
    end
  end

  path '/api/v3/fixed_sessions/{uuid}/measurements' do
    post 'Upload binary measurements for an AirBeamMini session' do
      tags 'Mobile app: Fixed sessions'
      consumes 'application/octet-stream'
      produces 'application/json'
      description <<~DESC
        ## Binary format

        ```
        Offset     Size  Type        Description
        0          2     uint8[2]    Magic bytes: 0xAB 0xBA
        2          2     uint16 BE   Measurement count N
        --- repeated N times ---
        4+i*9      4     uint32 BE   Unix timestamp (seconds since epoch, UTC)
        8+i*9      1     uint8       sensor_type_id (returned by session creation endpoint)
        9+i*9      4     float32 BE  Sensor value
        --- end repeat ---
        4+N*9      1     uint8       XOR checksum of all preceding bytes
        ```

        **Resends are free.** A frame whose `(stream_id, time_with_time_zone)` is
        already stored is skipped; no duplicate is created.

        **Size limit:** at most 6000 frames (54005 bytes) per request. Split a larger
        backlog across requests.

        **Unusable timestamps:** a frame whose epoch is zero, before 2020-01-01 UTC,
        or more than 24 hours ahead of server time is dropped; the rest of the payload
        is stored and the response is still `200`.

        **Time synchronisation:** an empty body returns `200` immediately. Read the
        current server time from the `X-Server-Time` response header (Unix epoch, UTC).

        ## Error codes

        All error responses share the shape `{ "error_code": "...", "message": "..." }`.

        | `error_code` | HTTP | Description |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token |
        | `session_not_found` | 404 | No session with the given UUID exists for this user/token |
        | `payload_too_short` | 400 | Payload has fewer bytes than required for even one frame |
        | `invalid_magic_bytes` | 400 | First 2 bytes are not `0xAB 0xBA` |
        | `empty_measurement_count` | 400 | Frame count field in header is zero |
        | `payload_size_mismatch` | 400 | Actual payload size does not match the declared frame count |
        | `invalid_checksum` | 400 | XOR checksum of payload does not match the final byte |
        | `invalid_value` | 400 | A frame's sensor value is NaN or Infinity |
        | `payload_too_large` | 413 | More than 6000 frames, or a body over 54005 bytes. Nothing is stored — resend in smaller batches |
        | `try_again_later` | 503 | Temporarily unavailable. Nothing is stored — resend after the `Retry-After` header (seconds) |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'Session UUID (same as used in session creation)'

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'AirBeam: `Bearer <session_token>` (returned by session creation; valid for this session only). Mobile app: `Bearer <user_token>`.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :string,
        format: :binary,
        description: 'Binary payload as described in the endpoint description'
      }

      response '200', 'measurements stored (or empty body time-sync)' do
        before(:all) do
          @user = create(:user)
          @session = create(:fixed_session, user: @user)
          @threshold_set = ThresholdSet.find_or_create_by!(
            sensor_name: 'AirBeam-PM2.5', unit_symbol: 'µg/m³', is_default: true,
            threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
            threshold_high: 55, threshold_very_high: 150
          )
          @stream = Stream.create!(
            session: @session,
            sensor_name: 'AirBeam-PM2.5',
            sensor_package_name: 'AA:BB:CC:DD:EE:FF',
            unit_name: 'micrograms per cubic meter',
            measurement_type: 'Particulate Matter',
            measurement_short_type: 'PM',
            unit_symbol: 'µg/m³',
            threshold_set: @threshold_set,
            sensor_type_id: 2,
            min_latitude: 40.7128,
            max_latitude: 40.7128,
            min_longitude: -74.006,
            max_longitude: -74.006
          )
        end

        after(:all) do
          @stream&.delete
          @threshold_set&.delete
          @session&.delete
          @user&.destroy
        end

        let(:uuid) { @session.uuid }
        let(:Authorization) { "Bearer #{@user.authentication_token}" }
        let(:body) { build_measurement_binary(type_id: 2) }


        run_test!
      end

      response '400', 'invalid payload or unknown sensor_type_id' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:session) { create(:fixed_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { 'not valid binary' }


        run_test!
      end

      response '413', 'payload larger than one request may carry' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:session) { create(:fixed_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        # A header declaring more frames than the cap. Rejected on the count alone,
        # so the example does not have to carry 54 KB of frames.
        let(:body) do
          over = ::FixedSessions::BinaryProtocol::Parser::MAX_MEASUREMENTS + 1
          payload = ["\xAB\xBA", over].pack('a2n') + [Time.current.to_i, 2, 12.5].pack('NCg')
          payload + [payload.bytes.inject(0, :^)].pack('C')
        end

        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:uuid) { 'non-existent-uuid' }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { build_measurement_binary(type_id: 1) }


        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { "\x00" }

        run_test!
      end
    end
  end
end
