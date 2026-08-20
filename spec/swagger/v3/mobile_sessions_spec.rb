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

  ERROR_SCHEMA = {
    type: :object,
    required: %w[error_code message],
    properties: {
      error_code: { type: :string },
      message: { type: :string }
    }
  }.freeze

  path '/api/v3/mobile_sessions' do
    get "List the signed-in user's mobile sessions" do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Returns the authenticated user's own mobile sessions — metadata and
        per-stream aggregates, **no measurements**. Ownership is implicit from the
        token. Returns the full authoritative set by default, so the client can
        treat a locally-known session that is absent here as deleted; pass
        `page` / `per_page` to paginate the rare heavy account.
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'
      parameter name: :page, in: :query, required: false, schema: { type: :integer },
                description: '1-based page (with per_page)'
      parameter name: :per_page, in: :query, required: false, schema: { type: :integer },
                description: 'Page size; omit for the full set'

      response '200', 'sessions' do
        schema type: :array, items: {
          type: :object,
          properties: {
            id: { type: :integer },
            uuid: { type: :string },
            title: { type: :string },
            type: { type: :string, example: 'MobileSession' },
            tag_list: { type: :string },
            contribute: { type: :boolean },
            start_time_local: { type: :string, nullable: true,
                                description: 'null until the first measurements arrive' },
            end_time_local: { type: :string, nullable: true },
            version: { type: :integer },
            latitude: { type: :number, format: :float, nullable: true },
            longitude: { type: :number, format: :float, nullable: true },
            share_url: { type: :string, example: 'http://aircasting.org/s/ab12c',
                         description: 'Shareable session link' },
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
              description: 'Keyed by sensor_name; aggregates only',
              additionalProperties: { type: :object, additionalProperties: true },
              example: {
                'AirBeamMini-PM2.5' => {
                  id: 123, sensor_name: 'AirBeamMini-PM2.5', measurement_type: 'Particulate Matter',
                  unit_symbol: 'µg/m³', measurements_count: 1440, average_value: 12.5,
                  min_latitude: 40.70, max_latitude: 40.75, min_longitude: -74.02, max_longitude: -73.98,
                  threshold_low: 9, threshold_medium: 35, threshold_high: 55, threshold_very_high: 150, threshold_very_low: 0
                }
              }
            }
          }
        }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        before do
          session = create(:mobile_session, user: user)
          create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
          sign_in user
        end
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:Authorization) { 'Token token=invalid' }
        run_test!
      end
    end

    post 'Create a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates a new AirBeam mobile (moving) session, wrapping the legacy
        `sessions` / `streams` model. The app calls this once at the start of a
        recording; measurements are then streamed to
        `POST /api/v3/mobile_sessions/{uuid}/measurements`.

        This call is configuration only. `start_time_local` / `end_time_local`
        stay `null` until the first measurements arrive; such a session is
        skipped by every map / search query and is visible only to its owner
        (list, show, update, delete).

        Notes vs. the fixed-session create:
        - `time_zone` is **required** (not derived from coordinates).
        - `start_time` / `end_time` are **not** sent — they are derived from the
          measurement bounds on ingest.
        - `latitude` / `longitude` are optional (the session start point); each
          measurement carries its own location.
        - No `session_token` is returned — the measurements upload authenticates
          with the user token.
        - `uuid` must be in canonical UUID form and unused.
        - Fields outside this schema (`is_indoor`, `version`, `start_time`, …)
          are ignored; mobile sessions are always stored as outdoor and the
          version is server-owned (bumped by `PATCH`).

        The response includes a `sensor_type_id` per stream, used to identify
        streams in the binary measurement upload.

        ## share_url

        `share_url` is the session's capability link (`<host>/s/<token>`).
        Anyone holding it can open the session, which is how a private
        (`contribute: false`) session is shared. Store it with the session — the
        list / show / update responses return it too, so a session synced onto a
        second device stays shareable. Append the stream before sharing:
        `<share_url>?sensor_name=AirBeamMini-PM2.5` — the link only resolves
        with that query parameter. It is a full URL, not a token, because the
        backend host is configurable.

        ## Thresholds

        Each stream may carry `thresholds` — the colour-scale bounds shown in the app and
        on the map. Resolution order:

        1. values sent with the stream — an identical set is reused rather than duplicated,
           and sending the sensor's default values simply reuses the default row;
        2. the sensor's seeded default set (AirBeam sensors and `Phone Microphone` have one);
        3. neither — `validation_error`, telling the client to send `thresholds`.

        Values must ascend (`very_low ≤ low ≤ medium ≤ high ≤ very_high`); a negative floor
        is fine, which is what a calibrated microphone scale looks like.

        ## Streams

        Each sensor type may appear **once** per session — `AirBeamMini-PM2.5`
        and `AirBeam2-PM2.5` are the same type (`AirBeam-PM2.5`) and cannot both
        be requested. A session holds one stream per type, and the binary upload
        addresses streams by `sensor_type_id`.

        ## Error Codes

        A request whose **shape** is wrong answers `validation_error` with
        `fields`; a request that conflicts with **stored state** gets its own
        code and no `fields`. `POST /api/v3/fixed_sessions` uses the same
        vocabulary.

        | `error_code` | HTTP | Description | Client should |
        |---|---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token | Re-authenticate |
        | `validation_error` | 400 | Body failed validation. See `fields` | Treat as a client bug — do not retry unchanged |
        | `session_uuid_taken` | 400 | A session with this `uuid` already exists. No `fields` | Stop retrying; the session is already created — continue with it |
        | `unsupported_sensor_type` | 400 | A requested `sensor_name` has no known sensor type | Unrecoverable; do not retry |
        | `internal_error` | 400 | Server could not create the session (e.g. missing default thresholds) | Retry with backoff |
      DESC

      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[uuid title time_zone contribute device streams],
        properties: {
          uuid: { type: :string, format: :uuid, example: '550e8400-e29b-41d4-a716-446655440000' },
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
                   description: 'Shareable session link — see the endpoint description.'
                 },
                 streams: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[sensor_name sensor_type_id],
                     properties: {
                       sensor_name: { type: :string, example: 'AirBeamMini-PM2.5' },
                       sensor_type_id: { type: :integer, example: 2 }
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
        let(:Authorization) { "Token token=#{user.authentication_token}" }
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

        before { sign_in user }

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
                   additionalProperties: { type: :array, items: { type: :string } }
                 }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { { uuid: '' } }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:Authorization) { 'Token token=invalid' }
        let(:body) { {} }

        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}' do
    get 'Get one of the signed-in user\'s mobile sessions' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Returns a single mobile session owned by the authenticated user — metadata
        and per-stream aggregates, **no measurements** (fetch those from the
        `/measurements` path). Same shape as one element of the list endpoint.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      response '200', 'session' do
        schema type: :object,
               properties: {
                 id: { type: :integer },
                 uuid: { type: :string },
                 title: { type: :string },
                 type: { type: :string, example: 'MobileSession' },
                 tag_list: { type: :string },
                 contribute: { type: :boolean },
                 start_time_local: { type: :string, nullable: true,
                                     description: 'null until the first measurements arrive' },
                 end_time_local: { type: :string, nullable: true },
                 version: { type: :integer },
                 latitude: { type: :number, format: :float, nullable: true },
                 longitude: { type: :number, format: :float, nullable: true },
                 share_url: { type: :string, example: 'http://aircasting.org/s/ab12c',
                              description: 'Shareable session link' },
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
                   description: 'Keyed by sensor_name; aggregates only',
                   additionalProperties: { type: :object, additionalProperties: true },
                   example: {
                     'AirBeamMini-PM2.5' => {
                       id: 123, sensor_name: 'AirBeamMini-PM2.5', measurement_type: 'Particulate Matter',
                       unit_symbol: 'µg/m³', measurements_count: 1440, average_value: 12.5
                     }
                   }
                 }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        before do
          create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')
          sign_in user
        end
        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        before { sign_in user }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        run_test!
      end
    end

    patch 'Update a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Partial update of a mobile session: any subset of `title`, `tag_list`,
        `notes`, `streams` (to delete), and `device` info. Only the
        provided fields change. Streams flagged `deleted: true` are removed. The
        `device` object adds a device when the session has none, updates
        `model`/`name` on the current device, or swaps to another by `mac_address`.
        Bumps the session `version` and returns the updated session.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        properties: {
          title: { type: :string, example: 'Renamed ride' },
          tag_list: { type: :string, example: 'commute, bike' },
          notes: {
            type: :array,
            items: {
              type: :object,
              required: %w[number],
              properties: {
                number: { type: :integer },
                text: { type: :string },
                date: { type: :string, description: 'ISO 8601 (required for new notes)' },
                latitude: { type: :number, format: :float },
                longitude: { type: :number, format: :float }
              }
            }
          },
          streams: {
            type: :array,
            description: 'Streams to delete (flag deleted: true)',
            items: {
              type: :object,
              required: %w[sensor_name],
              properties: {
                sensor_name: { type: :string, example: 'AirBeamMini-PM1' },
                sensor_package_name: { type: :string },
                deleted: { type: :boolean, example: true }
              }
            }
          },
          device: {
            type: :object,
            properties: {
              mac_address: { type: :string, example: 'AA:BB:CC:DD:EE:FF' },
              model: { type: :string, example: 'AirBeamMini' },
              name: { type: :string, nullable: true, example: 'Backpack' }
            }
          }
        }
      }

      response '200', 'updated session' do
        schema type: :object, properties: {
          uuid: { type: :string },
          title: { type: :string },
          version: { type: :integer },
          tag_list: { type: :string },
          share_url: { type: :string, example: 'http://aircasting.org/s/ab12c', description: 'Shareable session link' },
          device: { type: :object, nullable: true, additionalProperties: true },
          streams: { type: :object, additionalProperties: { type: :object, additionalProperties: true } }
        }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { title: 'Renamed ride',
            device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini', name: 'Backpack' } }
        end
        before { sign_in user }
        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        let(:body) { { title: 'x' } }
        before { sign_in user }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        let(:body) { { title: 'x' } }
        run_test!
      end
    end

    delete 'Delete a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Deletes one of the caller's mobile sessions. Cascades its streams,
        measurements and notes, and records a tombstone so other devices can drop
        the session (the list endpoint also reflects the deletion by absence).
        Returns 204 No Content.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'

      response '204', 'deleted' do
        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        before { sign_in user }
        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        before { sign_in user }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}/measurements' do
    get 'Get measurements for a mobile session' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Returns measurements for the session, keyed by sensor_name, each an array
        of `{ time, value, latitude, longitude }`. Defaults to the **latest 24h**
        (anchored on the session end) for a light initial fetch; pass
        `start_time` / `end_time` (epoch **milliseconds**) to pull any older range.
        Optional `sensor_name` / `measurement_type` fetch a single stream.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'
      parameter name: :sensor_name, in: :query, required: false, schema: { type: :string }
      parameter name: :measurement_type, in: :query, required: false, schema: { type: :string }
      parameter name: :start_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms (defaults to end - 24h)'
      parameter name: :end_time, in: :query, required: false, schema: { type: :integer },
                description: 'Epoch ms (defaults to session end)'

      response '200', 'measurements keyed by sensor_name' do
        schema type: :object,
               additionalProperties: {
                 type: :array,
                 items: {
                   type: :object,
                   properties: {
                     time: { type: :string, description: 'ISO 8601 (local-as-utc)' },
                     value: { type: :number },
                     latitude: { type: :number, format: :float },
                     longitude: { type: :number, format: :float }
                   }
                 }
               },
               example: {
                 'AirBeamMini-PM2.5' => [
                   { time: '2026-08-14T11:30:00.000Z', value: 12.5, latitude: 40.0, longitude: -74.0 }
                 ]
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:session_record) do
          create(:mobile_session, user: user, time_zone: 'UTC', end_time_local: Time.utc(2026, 8, 14, 12, 0, 0))
        end
        let(:uuid) { session_record.uuid }
        before do
          stream = create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')
          stream.build_measurements!([{ time: Time.utc(2026, 8, 14, 11, 30, 0), value: 12.5, latitude: 40.0,
                                        longitude: -74.0 }])
          sign_in user
        end
        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        before { sign_in user }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        run_test!
      end
    end

    post 'Send binary measurements for a mobile session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/octet-stream'
      produces 'application/json'
      description <<~DESC
        Uploads AirBeam mobile measurements as a binary payload. Authenticated with
        the **user token** (no per-session token). Can be called live during a
        recording or in bulk to sync measurements the AirBeam delivered late.

        ## Binary Format

        Each frame extends the fixed frame with per-point location. **No
        milliseconds** — mobile records at interval sampling (1s / 5s / 1 / 5 / 10 min).

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

        On ingest the session's start/end are refined from the measurement bounds
        and the stream aggregates (bounding box, average, start coordinates) are
        recomputed. An empty body returns 200 (reads server time from `X-Server-Time`).

        ## Error Codes

        | `error_code` | HTTP | Description |
        |---|---|---|
        | `unauthorized` | 401 | Missing or invalid `Authorization` token |
        | `session_not_found` | 404 | No mobile session with the given UUID for this user |
        | `payload_too_short` / `invalid_magic_bytes` / `empty_measurement_count` / `payload_size_mismatch` / `invalid_checksum` / `invalid_epoch` / `invalid_value` / `invalid_location` | 400 | Malformed payload |
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true,
                description: 'Session UUID (same as used in session creation)'
      parameter name: :Authorization, in: :header, type: :string, required: true,
                description: 'Token token=<user_token>'
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
        let(:Authorization) { "Token token=#{@user.authentication_token}" }
        let(:body) { build_mobile_measurement_binary(type_id: 2) }

        before { sign_in @user }

        run_test!
      end

      response '400', 'invalid payload' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user) }
        let(:uuid) { session.uuid }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { 'not valid binary' }

        before { sign_in user }

        run_test!
      end

      response '404', 'session not found' do
        schema ERROR_SCHEMA

        let(:user) { create(:user) }
        let(:uuid) { 'non-existent-uuid' }
        let(:Authorization) { "Token token=#{user.authentication_token}" }
        let(:body) { build_mobile_measurement_binary(type_id: 2) }

        before { sign_in user }

        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA

        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Token token=invalid' }
        let(:body) { "\x00" }

        run_test!
      end
    end
  end
end
