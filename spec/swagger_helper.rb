require 'rails_helper'

# One note, as every v3 endpoint returns it: the note endpoints and the session
# show/update response. Defined here rather than in either spec file because
# both need it and a second copy would drift — and because rswag spec constants
# leak to the top level, so two definitions silently override each other.
V3_NOTE_SCHEMA = {
  type: :object,
  required: %w[id],
  properties: {
    id: { type: :integer, description: "The note's identity — use it to address the note" },
    number: { type: :integer, nullable: true,
              description: 'Server-allocated ordering key, 0-based. Not an address: ' \
                           'gaps are normal and a number can be reused after a delete.' },
    text: { type: :string },
    date: { type: :string, description: 'Wall clock as the recording phone saw it' },
    latitude: { type: :number, format: :float },
    longitude: { type: :number, format: :float },
    photo_location: {
      type: :string, nullable: true,
      description: 'Full URL of the note photo (600px limit), or null when there is none'
    }
  }
}.freeze

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'AirCasting Mobile & Web API',
        version: '1.0.0',
        description: <<~DESC
          Endpoints used by the AirCasting mobile apps and web frontend.

          Tags are grouped by client: `Mobile app:` (iOS/Android) and `Web app:`
          (the web frontend). No endpoint is used by both. Tags marked
          **[DEPRECATED]** are served only for already-released mobile builds —
          build new clients against the `/api/v3` endpoints.
        DESC
      },
      components: {
        securitySchemes: {
          bearer_auth: {
            type: :http,
            scheme: :bearer,
            description: '`Authorization: Bearer <user_token>` (RFC 6750). The token is returned by sign-in.'
          },
          # Opted into per operation, never globally: every authenticated
          # pre-v3 endpoint, plus POST /api/v3/fixed_sessions.
          basic_auth: {
            type: :http,
            scheme: :basic,
            description: '`Authorization: Basic base64("<user_token>:X")`. The only scheme the pre-v3 `/api` endpoints accept. Not for new endpoints — `/api/v3` uses bearer.'
          }
        }
      },
      security: [{ bearer_auth: [] }],
      # Tag order + descriptions control the grouping shown in Swagger UI.
      # Two families, mobile app then web app; no endpoint belongs to both.
      # A legacy tag sits directly after the tag that replaces it.
      #
      # Unified data vocabulary across the whole API:
      #   AirBeam fixed  - roof-mounted AirBeam, streams continuously over WiFi
      #                    (the old "realtime" endpoints operate on these).
      #   AirBeam mobile - AirBeam in motion, uploaded when the session finishes.
      #   Station        - government integration data (EEA / EPA), stored in the
      #                    station_streams / station_measurements model.
      tags: [
        # --- Mobile apps (iOS + Android) ---
        { name: 'Mobile app: Account & auth',
          description: 'Sign in and sign up, user settings, account deletion, password reset.' },
        { name: 'Mobile app: Mobile sessions',
          description: 'AirBeam mobile (moving) sessions on `/api/v3`: create, list, show, update and delete a session, manage its notes, upload and read its measurements.' },
        { name: 'Mobile app: Mobile sessions [DEPRECATED]',
          description: 'Legacy AirBeam mobile session upload, download, sync and update. Replaced by *Mobile app: Mobile sessions*.' },
        { name: 'Mobile app: Fixed sessions',
          description: 'AirBeam fixed (roof-mounted) sessions on `/api/v3`: create a session, list the user\'s own sessions, and upload measurements.' },
        { name: 'Mobile app: Fixed sessions [DEPRECATED]',
          description: 'Legacy AirBeam fixed session create, measurement upload and polling (the `realtime/*` paths), plus the fixed session and stream reads. Replaced by *Mobile app: Fixed sessions*.' },
        { name: 'Mobile app: Threshold alerts',
          description: 'Threshold (push-notification) alerts: list, create, delete.' },
        { name: 'Mobile app: Export & sharing',
          description: 'Email a CSV export of one session — AirBeam mobile or AirBeam fixed.' },
        # --- Web frontend ---
        { name: 'Web app: Fixed sessions',
          description: 'AirBeam fixed map lists, stream detail, measurements and daily averages. The map lists also return Station (government) data.' },
        { name: 'Web app: Mobile sessions',
          description: 'AirBeam mobile (moving) session map list and single stream detail.' },
        { name: 'Web app: Station data (government)',
          description: 'Station (EEA/EPA) stream detail, measurements, daily averages and CSV export, in the `station_streams` / `station_measurements` model.' },
        { name: 'Web app: Map aggregations',
          description: 'CrowdMap grid averages, region summary, timelapse clusters.' },
        { name: 'Web app: Autocomplete',
          description: 'Filter autocomplete for tag names and usernames.' },
        { name: 'Web app: Sensors & thresholds',
          description: 'Sensor lists and threshold sets.' },
        { name: 'Web app: Export & sharing',
          description: 'Session CSV export and short-URL creation.' }
      ],
      paths: {}
    }
  }

  config.openapi_format = :yaml
end
