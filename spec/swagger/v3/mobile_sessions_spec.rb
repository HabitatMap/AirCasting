require 'swagger_helper'

# New AirBeam MOBILE (moving) session API for the app rewrite. Session management
# only — measurements upload is binary (see the /measurements path). All endpoints
# require the user token; the caller owns the sessions (implicit from the token).
RSpec.describe 'AirBeam Mobile Sessions', type: :request do
  def build_mobile_measurement_binary(type_id:, epoch: Time.current.to_i, value: 12.5, lat: 40.7128, lng: -74.006)
    header = ["\xAB\xBA", 1].pack('a2n')
    measurement = [epoch, type_id, value, lat, lng].pack('NCgGG')
    payload = header + measurement
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  path '/api/v3/mobile_sessions' do
    get "[ALPHA] List the signed-in user's mobile sessions" do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Ordered by upload time, newest first — not recording time. Page 1 holds
        the most recently uploaded sessions and can be rendered while later pages
        load. Sort by `start_time` client-side to display them in recording order.

        The list is authoritative: walk it to the last page, and a session the
        client holds locally but never saw has been deleted server-side.

        A `page` past the end answers `200` with an empty `sessions` array.
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
                  maximum: Api::ListMobileSessionsContract::MAX_PER_PAGE,
                  default: MobileSessions::List::DEFAULT_PER_PAGE,
                },
                description: "Page size, 1..#{Api::ListMobileSessionsContract::MAX_PER_PAGE}"

      response '200', 'sessions' do
        schema type: :object,
               required: %w[sessions meta],
               properties: {
                 meta: {
                   type: :object,
                   description: 'Describes the whole collection, not the returned page',
                   required: %w[total page per_page total_pages],
                   properties: {
                     total: { type: :integer, example: 812,
                              description: "Total mobile sessions the user owns" },
                     page: { type: :integer, example: 1 },
                     per_page: { type: :integer, example: 500 },
                     total_pages: { type: :integer, example: 2,
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
            type: { type: :string, example: 'MobileSession' },
            tag_list: { type: :string },
            contribute: { type: :boolean },
            time_zone: { type: :string, example: 'America/New_York',
                         description: 'IANA zone the session was recorded in; render start_time / end_time and measurement times in it' },
            start_time: { type: :integer, format: :int64, nullable: true, example: 1_786_663_800_000,
                          description: 'Epoch ms (UTC); null until the first measurements arrive' },
            end_time: { type: :integer, format: :int64, nullable: true, example: 1_786_707_000_000 },
            finished_at: { type: :integer, format: :int64, nullable: true, example: 1_786_707_060_000,
                           description: 'Epoch ms (UTC) the user declared the recording over; null while it is ' \
                                        'still running.' },
            version: { type: :integer },
            latitude: { type: :number, format: :float, nullable: true },
            longitude: { type: :number, format: :float, nullable: true },
            share_url: { type: :string, example: 'http://aircasting.org/s/ab12c',
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
              description: 'Keyed by sensor_name; aggregates only. `sensor_type_id` is the ' \
                           'handle the binary measurements upload addresses the stream by, and is ' \
                           '`null` on a session recorded before this API group existed — decode it ' \
                           'as nullable.',
              additionalProperties: { type: :object, additionalProperties: true },
              example: {
                'AirBeamMini-PM2.5' => {
                  sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2,
                  measurement_type: 'Particulate Matter',
                  unit_symbol: 'µg/m³', measurements_count: 1440, average_value: 12.5,
                  min_latitude: 40.70, max_latitude: 40.75, min_longitude: -74.02, max_longitude: -73.98,
                  threshold_low: 9, threshold_medium: 35, threshold_high: 55, threshold_very_high: 150, threshold_very_low: 0
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
          session = create(:mobile_session, user: user)
          create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
        end
        run_test!
      end

      response '400', 'invalid pagination parameters' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Query parameters are invalid' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:per_page) { 0 }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end

    post '[ALPHA] Create a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Call it once at the start of a recording, then stream measurements to
        `POST /api/v3/mobile_sessions/{uuid}/measurements`.

        Creating the same `uuid` twice concurrently yields one session; both callers
        are answered with it and its streams. A `uuid` that already existed before the
        request is `session_uuid_taken`.

        ## Streams

        **Known sensors** (AirBeam PM1 / PM2.5 / PM10 / RH / F and `Phone Microphone`)
        need only `sensor_name` and `unit_symbol`. Anything else is a **custom sensor**
        and must also send `measurement_type`, `measurement_short_type`, `unit_name`
        and `thresholds`; its fields cap at 64 characters and its `sensor_name` may
        not reuse a built-in one.

        Each sensor type may appear once per session: `AirBeamMini-PM2.5` and
        `AirBeam2-PM2.5` are the same type (`AirBeam-PM2.5`). Built-in
        `sensor_type_id`s are 1–99 and globally stable; a custom sensor is assigned
        one from 100–255, unique within the session.

        ## Error codes

        `{ error_code, message, fields? }`, as everywhere in v3. `fields` appears
        only when the request shape is wrong.

        | `error_code` | HTTP | When | Client should |
        |---|---|---|---|
        | `unauthorized` | 401 | Missing or invalid token | Re-authenticate |
        | `validation_error` | 400 | Malformed body, or a custom sensor with no `thresholds` and no seeded default | Do not retry unchanged |
        | `session_uuid_taken` | 409 | The `uuid` is already in use | Stop retrying; continue with the existing session |
        | `unsupported_sensor_type` | 400 | Unknown `sensor_name`, or more custom sensors than the 100–255 range holds | Unrecoverable |
        | `try_again_later` | 503 | Temporarily unavailable | Retry after the `Retry-After` header (seconds) |
        | `internal_error` | 500 | Unexpected server error | Retry with backoff |
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[uuid title time_zone contribute device streams],
        properties: {
          uuid: { type: :string, format: :uuid, example: '550e8400-e29b-41d4-a716-446655440000',
                  description: 'Canonical UUID form; must not already be in use.' },
          title: { type: :string, example: 'Morning bike ride' },
          time_zone: { type: :string, example: 'America/New_York',
                       description: 'IANA time zone identifier (required).' },
          contribute: { type: :boolean, example: true,
                        description: 'Required — send it explicitly; the server applies no default.' },
          tag_list: { type: :string, nullable: true, example: 'commute, bike',
                      description: 'Space/comma separated tags.' },
          latitude: { type: :number, format: :float, nullable: true, example: 40.7128,
                      description: 'Optional session start point.' },
          longitude: { type: :number, format: :float, nullable: true, example: -74.0060 },
          device: {
            type: :object,
            required: %w[mac_address model],
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF',
                             description: 'Stable device identifier. For an AirBeam this is its MAC; ' \
                                          'a custom integration may send any stable id its hardware exposes.' },
              model: { type: :string, example: 'AirBeamMini',
                       description: 'Free-form model name — not restricted to AirBeam models.' },
              name: { type: :string, nullable: true, example: 'My AirBeam' }
            }
          },
          streams: {
            type: :array,
            minItems: 1,
            items: {
              type: :object,
              required: %w[sensor_name unit_symbol],
              properties: {
                sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
                unit_symbol: { type: :string, example: 'µg/m³' },
                measurement_type: { type: :string, nullable: true, example: 'Barometric pressure',
                                    description: 'Custom sensors only — required when the server does not know the sensor.' },
                measurement_short_type: { type: :string, nullable: true, example: 'hPa',
                                          description: 'Custom sensors only.' },
                unit_name: { type: :string, nullable: true, example: 'hectopascals',
                             description: 'Custom sensors only.' },
                thresholds: {
                  type: :object,
                  nullable: true,
                  required: %w[very_low low medium high very_high],
                  description: 'Optional colour-scale bounds. Omit to use the sensor default; ' \
                               'required for sensors that have none. Must be in ascending order.',
                  properties: {
                    very_low: { type: :number, example: 0 },
                    low: { type: :number, example: 9 },
                    medium: { type: :number, example: 35 },
                    high: { type: :number, example: 55 },
                    very_high: { type: :number, example: 150 }
                  }
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
               required: %w[share_url streams],
               properties: {
                 share_url: {
                   type: :string,
                   example: 'http://aircasting.org/s/ab12c',
                   description: 'Capability link (`<host>/s/<token>`) — anyone holding it can open the session, including a private one. Append `?sensor_name=<stream>`; the link only resolves with it.'
                 },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[sensor_name sensor_type_id],
                     properties: {
                       sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
                       sensor_type_id: { type: :integer, example: 2,
                                         description: 'Addresses this stream in the binary measurements upload.' }
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
            title: 'Morning bike ride',
            time_zone: 'America/New_York',
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
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_uuid_taken' },
                 message: { type: :string, example: 'A session with this uuid already exists' }
               }

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let!(:existing) { create(:mobile_session, user: user, uuid: SecureRandom.uuid) }
        let(:body) do
          {
            uuid: existing.uuid,
            title: 'Morning bike ride',
            time_zone: 'America/New_York',
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
      # documents; MobileSessions::Creator's own spec covers when it is returned.
      response '500', 'session could not be created' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'internal_error' },
                 message: { type: :string, example: 'Could not create this session' }
               }

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) do
          {
            uuid: SecureRandom.uuid,
            title: 'Morning bike ride',
            time_zone: 'America/New_York',
            contribute: true,
            device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
            streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }]
          }
        end

        before do
          allow_any_instance_of(MobileSessions::Creator).to receive(:call).and_return(
            Failure.new(
              error_code: MobileSessions::ErrorCodes::INTERNAL_ERROR,
              message: 'Could not create this session',
            ),
          )
        end

        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:Authorization) { 'Bearer invalid' }
        let(:body) { {} }

        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}' do
    get '[ALPHA] Get one of the signed-in user\'s mobile sessions' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'

      response '200', 'session' do
        schema type: :object,
               properties: {
                 uuid: { type: :string },
                 title: { type: :string },
                 type: { type: :string, example: 'MobileSession' },
                 tag_list: { type: :string },
                 contribute: { type: :boolean },
                 time_zone: { type: :string, example: 'America/New_York',
                              description: 'IANA zone the session was recorded in' },
                 start_time: { type: :integer, format: :int64, nullable: true, example: 1_786_663_800_000,
                               description: 'Epoch ms (UTC); null until the first measurements arrive' },
                 end_time: { type: :integer, format: :int64, nullable: true, example: 1_786_707_000_000 },
                 finished_at: { type: :integer, format: :int64, nullable: true, example: 1_786_707_060_000,
                                description: 'Epoch ms (UTC) the user declared the recording over; null while ' \
                                             'it is still running.' },
                 version: { type: :integer },
                 latitude: { type: :number, format: :float, nullable: true },
                 longitude: { type: :number, format: :float, nullable: true },
                 share_url: { type: :string, example: 'http://aircasting.org/s/ab12c',
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
                   description: 'Keyed by sensor_name; aggregates only. `sensor_type_id` is the ' \
                                'handle the binary measurements upload addresses the stream by, and is ' \
                                '`null` on a session recorded before this API group existed — decode it ' \
                                'as nullable.',
                   additionalProperties: { type: :object, additionalProperties: true },
                   example: {
                     'AirBeamMini-PM2.5' => {
                       sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2,
                       measurement_type: 'Particulate Matter',
                       unit_symbol: 'µg/m³', measurements_count: 1440, average_value: 12.5
                     }
                   }
                 },
                 notes: { type: :array, description: 'Ordered by number, then id', items: V3_NOTE_SCHEMA }
               },
               required: %w[uuid title type tag_list contribute time_zone version share_url streams notes]

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        before do
          create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)
          create(:note, session: session_record, number: 0)
        end
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end

    patch '[ALPHA] Update a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Empty `tag_list` clears the list
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        description: 'At least one of title, tag_list',
        properties: {
          title: { type: :string, example: 'Renamed ride' },
          tag_list: { type: :string, nullable: true, example: 'commute, bike',
                      description: 'A single string; whitespace and commas both separate tags. ' \
                                   'null or "" clears every tag.' },
        }
      }

      response '200', 'updated session' do
        schema type: :object, properties: {
          uuid: { type: :string },
          title: { type: :string },
          version: { type: :integer },
          finished_at: { type: :integer, format: :int64, nullable: true, example: 1_786_707_060_000,
                         description: 'Epoch ms (UTC); null while the recording is still running. ' \
                                      'Not editable here — see POST /finish.' },
          tag_list: { type: :string, description: 'Tags joined with ", "' },
          share_url: { type: :string, example: 'http://aircasting.org/s/ab12c',
                       description: 'Capability link; append `?sensor_name=<stream>` to open it' },
          device: { type: :object, nullable: true, additionalProperties: true,
                    example: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini', name: 'My AirBeam' } },
          streams: { type: :object, additionalProperties: { type: :object, additionalProperties: true },
                     example: {
                       'AirBeamMini-PM2.5' => {
                         sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2,
                         measurement_type: 'Particulate Matter',
                         unit_symbol: 'µg/m³', measurements_count: 1440, average_value: 12.5
                       }
                     } },
          notes: { type: :array, description: 'Ordered by number, then id', items: V3_NOTE_SCHEMA }
        }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { title: 'Renamed ride', tag_list: 'commute, bike' }
        end
        run_test!
      end

      response '400', 'validation error — `fields` carries the offending path' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: { type: :object, additionalProperties: true,
                           example: { base: ['must contain at least one of: title, tag_list'] } }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { title: '' }
        end
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        let(:body) { { title: 'x' } }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { { title: 'x' } }
        run_test!
      end
    end

    delete '[ALPHA] Delete a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Cascades to the session's streams, measurements, threshold alerts, notes and note photos. The
        uuid is matched case-insensitively.

      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'

      response '204', 'deleted, or already deleted' do
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        run_test!
      end

      # Stubbed: a lock wait timeout on the delete transaction. Retry-After is set
      # by render_error; MobileSessions::Destroyer's own spec covers when this and
      # internal_error below are returned.
      response '503', 'temporarily unavailable — retry after `Retry-After` seconds' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'try_again_later' },
                 message: { type: :string, example: 'Could not delete this session, please retry' }
               }

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let!(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }

        before do
          allow_any_instance_of(MobileSessions::Destroyer).to receive(:call).and_return(
            Failure.new(
              error_code: MobileSessions::ErrorCodes::TRY_AGAIN_LATER,
              message: 'Could not delete this session, please retry',
            ),
          )
        end

        run_test!
      end

      response '500', 'session could not be deleted' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'internal_error' },
                 message: { type: :string, example: 'Could not delete this session' }
               }

        let!(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let!(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }

        before do
          allow_any_instance_of(MobileSessions::Destroyer).to receive(:call).and_return(
            Failure.new(
              error_code: MobileSessions::ErrorCodes::INTERNAL_ERROR,
              message: 'Could not delete this session',
            ),
          )
        end

        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}/finish' do
    post '[ALPHA] Finish a mobile session' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Declares the recording over and stamps `finished_at`.
        Any measurements with timestamp after finished_at sent will be discarded.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'

      response '200', 'finished session — same shape as show' do
        schema type: :object,
               required: %w[uuid finished_at version],
               properties: {
                 uuid: { type: :string },
                 title: { type: :string },
                 finished_at: { type: :integer, format: :int64, example: 1_786_707_060_000,
                                description: 'Epoch ms (UTC). A real instant, not a local wall clock.' },
                 version: { type: :integer, description: 'Bumped on the call that actually finished the session' },
                 tag_list: { type: :string },
                 share_url: { type: :string, example: 'http://aircasting.org/s/ab12c' },
                 device: { type: :object, nullable: true, additionalProperties: true },
                 streams: { type: :object, additionalProperties: { type: :object, additionalProperties: true } },
                 notes: { type: :array, description: 'Ordered by number, then id', items: V3_NOTE_SCHEMA },
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' },
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' },
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}/measurements' do
    get '[ALPHA] Get measurements for a mobile session' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        One stream per call; read the names from `streams[].sensor_name` on the
        session endpoint. Omit the window to get the last 6 hours, anchored on the
        session end.

        The window bounds the answer and nothing is silently truncated — a short
        answer means there is no more data in it. Page further back by moving
        `end_time`. Both bounds are inclusive, so a point can repeat between adjacent
        pages; de-duplicate by `time`. A stream with no measurements answers `200 []`.

        Timestamps are real UTC instants — milliseconds in JSON, seconds in the
        binary frames. Nothing on the wire is local time; render local with the
        session's `time_zone`.

        ## Error codes

        | `error_code` | HTTP | When |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid token |
        | `validation_error` | 400 | Missing `sensor_name`, half a window, `end_time <= start_time`, a window over 12h, or a non-integer time. `fields` names the offending parameter. Answered **before** the session lookup |
        | `session_not_found` | 404 | No mobile session with this uuid for this user |
        | `not_found` | 404 | The session has no stream with this `sensor_name` |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'
      parameter name: :sensor_name, in: :query, required: true, schema: { type: :string },
                description: 'The one stream to read, e.g. `AirBeamMini-PM2.5`.'
      parameter name: :start_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms. Send with end_time; omit both for the last 6h.'
      parameter name: :end_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms. At most 12h after start_time.'

      response '200', 'measurements for the named stream, oldest first' do
        schema type: :array,
               items: {
                 type: :object,
                 properties: {
                   time: { type: :integer, format: :int64, description: 'Epoch milliseconds (UTC)' },
                   value: { type: :number },
                   latitude: { type: :number, format: :float },
                   longitude: { type: :number, format: :float }
                 }
               },
               example: [
                 { time: 1_786_707_000_000, value: 12.5, latitude: 40.0, longitude: -74.0 }
               ]

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) do
          create(:mobile_session, user: user, time_zone: 'UTC', end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
        end
        let(:uuid) { session_record.uuid }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }
        before do
          stream = create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')
          stream.build_measurements!([{ time: Time.utc(2026, 8, 14, 11, 30, 0), value: 12.5, latitude: 40.0,
                                        longitude: -74.0 }])
        end
        run_test!
      end

      response '400', 'missing sensor_name, or a window over 12 hours' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string },
                 fields: { type: :object, additionalProperties: { type: :array, items: { type: :string } },
                           example: { sensor_name: ['is missing'] } }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user, time_zone: 'UTC') }
        let(:uuid) { session_record.uuid }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }
        let(:start_time) { Time.utc(2026, 8, 13, 0, 0, 0).to_i * 1_000 }
        let(:end_time) { Time.utc(2026, 8, 14, 0, 0, 0).to_i * 1_000 }
        run_test!
      end

      response '404', 'session not found, or the session has no such stream' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:sensor_name) { 'AirBeamMini-PM2.5' }
        run_test!
      end
    end

    post '[ALPHA] Send binary measurements for a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/octet-stream'
      produces 'application/json'
      description <<~DESC
        ## Binary format

        ```
        Offset     Size  Type         Description
        0          2     uint8[2]     Magic bytes: 0xAB 0xBA
        2          2     uint16 BE    Measurement count N
        --- repeated N times (25 bytes each) ---
        +0         4     uint32 BE    Unix timestamp (seconds, UTC)
        +4         1     uint8        sensor_type_id (from session creation)
        +5         4     float32 BE   Sensor value
        +9         8     float64 BE   Latitude
        +17        8     float64 BE   Longitude
        --- end repeat ---
        4+N*25     1     uint8        XOR checksum of all preceding bytes
        ```

        Timestamps carry no milliseconds and must fall between 2020-01-01 UTC and 24
        hours ahead of server time; a frame outside that range is rejected.

        **Resends are free.** A frame whose `(stream, timestamp)` is already stored is
        skipped and the stream aggregates do not count it twice. The same holds
        inside one payload — a repeated timestamp is stored once, keeping the first
        occurrence. Order does not matter, so chunk however you like.

        An empty body returns `200`; use it to read the current server time from the
        `X-Server-Time` response header.

        ## A finished session

        A session that has been finished still accepts a backlog: frames timestamped
        **at or before** its `finished_at` are stored as usual, so a phone that was
        offline for a week can sync everything it recorded. Frames timestamped
        **after** `finished_at` are dropped, and the response is still `200` — the
        recording is over and there is nothing to retry. A batch that straddles the
        finish keeps the earlier frames and drops the later ones, so the answer does
        not distinguish the two cases: read `finished_at` on the session to know.

        ## Size limit

        At most **3000 measurements** per request, so **75005 bytes**
        (`4 + 3000 * 25 + 1`). A larger upload is refused with `413` and nothing is
        stored — split it across requests.

        ## Error codes

        | `error_code` | HTTP | Description |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token |
        | `session_not_found` | 404 | No mobile session with the given UUID for this user |
        | `unsupported_sensor_type` | 400 | A frame names a `sensor_type_id` this session has no stream for. Nothing is stored — re-read the session's streams and resend |
        | `payload_too_short` / `invalid_magic_bytes` / `empty_measurement_count` / `payload_size_mismatch` / `invalid_checksum` / `invalid_epoch` / `invalid_value` / `invalid_location` | 400 | Malformed payload |
        | `payload_too_large` | 413 | More than 3000 measurements (or more than 75005 bytes). Nothing is stored — resend in smaller batches |
        | `try_again_later` | 503 | Temporarily unavailable. Nothing is stored — resend after the `Retry-After` header (seconds) |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'Session UUID (same as used in session creation)'
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Bearer <user_token>'
      parameter name: :body, in: :body, required: true, schema: {
        type: :string, format: :binary, description: 'Binary payload as described above'
      }

      response '200', 'measurements stored (or empty body time-sync)' do
        before(:all) do
          @user = create(:user)
          @session = create(:mobile_session, user: @user, time_zone: 'America/New_York')
          @threshold_set = ThresholdSet.find_or_create_by!(
            sensor_name: 'AirBeam-PM2.5', unit_symbol: 'µg/m³', is_default: true,
            threshold_very_low: 0, threshold_low: 9, threshold_medium: 35,
            threshold_high: 55, threshold_very_high: 150
          )
          @stream = Stream.create!(
            session: @session, sensor_name: 'AirBeamMini-PM2.5',
            sensor_package_name: 'AA:BB:CC:DD:EE:FF', unit_name: 'micrograms per cubic meter',
            measurement_type: 'Particulate Matter', measurement_short_type: 'PM',
            unit_symbol: 'µg/m³', threshold_set: @threshold_set, sensor_type_id: 2
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
        let(:body) { build_mobile_measurement_binary(type_id: 2) }


        run_test!
      end

      response '400', 'invalid payload' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'invalid_magic_bytes' },
                 message: { type: :string, example: 'magic bytes are not 0xAB 0xBA' }
               }

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { 'not valid binary' }


        run_test!
      end

      response '400', 'sensor_type_id has no stream on this session' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unsupported_sensor_type' },
                 message: { type: :string, example: 'session has no stream for sensor_type_id 99' }
               }

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { build_mobile_measurement_binary(type_id: 99) }

        run_test!
      end

      response '413', 'payload larger than one request may carry' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'payload_too_large' },
                 message: { type: :string, example: 'measurement count exceeds 3000' }
               }

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        # A header declaring more frames than the cap. Rejected on the count
        # alone, so the example does not have to carry 75 KB of frames.
        let(:body) do
          over = ::MobileSessions::BinaryProtocol::Parser::MAX_MEASUREMENTS + 1
          payload = ["\xAB\xBA", over].pack('a2n') +
                    [Time.current.to_i, 2, 12.5, 40.7128, -74.006].pack('NCgGG')
          payload + [payload.bytes.inject(0, :^)].pack('C')
        end

        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }

        let(:user) { create(:user) }
        let(:uuid) { 'non-existent-uuid' }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:body) { build_mobile_measurement_binary(type_id: 2) }


        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { "\x00" }

        run_test!
      end
    end
  end
end
