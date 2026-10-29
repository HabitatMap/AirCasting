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

# The `fields` half of the shared error body — every `/api/v3` endpoint and
# the `/api/user` account operations. Defined here because seven spec files
# need it and copies would drift — and because rswag spec constants leak to the
# top level, so two definitions silently override each other.
#
# Deliberately carries no `additionalProperties`: the keys are whatever the
# client got wrong, so a structural schema could only say "object", which
# documents nothing. Each operation overrides `example` with a real failure
# from that endpoint instead — `ERROR_FIELDS_SCHEMA.merge(example: {...})`.
ERROR_FIELDS_SCHEMA = {
  type: :object,
  description: <<~DESC,
    Per-field validation errors. Present only when the request shape is wrong.

    Keys are the parameters that failed, nested exactly as they were sent — a
    bad stream appears under its index in the array. Every leaf is a list of
    objects, one per failure:

    - `code` — machine-readable. Switch on this to show your own translated
      message; this API is not localised.
    - `message` — English, a fallback for codes you do not handle yet. Never
      parse it.
    - `params` — present when the message interpolates a value, so the
      sentence can be rebuilt in another language. `too_small` carries `min`,
      `not_included` carries `allowed`.

    Codes for a value of the wrong shape are the same on every endpoint:

    `missing`, `blank`, `not_a_string`, `not_an_integer`, `not_a_float`,
    `not_a_boolean`, `not_a_time`, `not_a_date`, `not_a_date_time`,
    `not_an_array`, `not_a_hash`, `too_small` (`min`), `too_large` (`max`),
    `too_short` (`min`), `too_long` (`max`), `not_included` (`allowed`),
    `invalid_format` (`format`), `wrong_size` (`size`).

    Codes for a rule the endpoint enforces are specific to it — `greater_than`,
    `greater_than_or_equal_to`, `window_too_long`, `unknown_value`, `duplicate`,
    `requires_one_of` and so on. Each one that compares two parameters carries
    the other's name in `params.other`. Each operation's `fields` example shows
    the codes it can return.

    New codes are added as the API grows, and `invalid` is used wherever a
    failure has prose but no code assigned yet. Treat both the same way: fall
    back to `message`. A client must never break on a code it does not know.
  DESC
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
            description: '`Authorization: Bearer <user_token>` (RFC 6750). The token is returned by sign-in. Preferred — send this from any new client.'
          },
          # Opted into per operation, never globally: every authenticated
          # pre-v3 endpoint, plus POST /api/v3/fixed_sessions.
          basic_auth: {
            type: :http,
            scheme: :basic,
            description: '`Authorization: Basic base64("<user_token>:X")`. What every shipped build sends to the pre-v3 `/api` endpoints, and the only scheme most of them accept. Not for new endpoints — `/api/v3`, and the `/api/user` account operations, take bearer.'
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
          description: 'Sign in and sign up, account settings, account deletion, password reset. ' \
                       'Where an operation lists both `bearer_auth` and `basic_auth` it accepts either, ' \
                       'both carrying the same token — prefer bearer; basic is kept for already-released builds.' },
        { name: 'Mobile app: Mobile sessions',
          description: 'AirBeam mobile (moving) sessions on `/api/v3`: create, list, show, update and delete a session, manage its notes, upload and read its measurements.' },
        { name: 'Mobile app: Mobile sessions [DEPRECATED]',
          description: 'Legacy AirBeam mobile session upload, download, sync and update. Replaced by *Mobile app: Mobile sessions*.' },
        { name: 'Mobile app: Fixed sessions',
          description: 'AirBeam fixed (roof-mounted) sessions on `/api/v3`: create a session, list the user\'s own sessions, and upload measurements.' },
        { name: 'Mobile app: Fixed sessions [DEPRECATED]',
          description: 'Legacy AirBeam fixed session create, measurement upload and polling (the `realtime/*` paths), plus the fixed session and stream reads. Replaced by *Mobile app: Fixed sessions*.' },
        { name: 'Mobile app: Explore map',
          description: 'Public map of active AirBeam fixed sessions and government stations together, clustered on the server.' },
        { name: 'Mobile app: Thresholds',
          description: 'The default colour-scale bands for every measurement AirCasting serves. ' \
                       'Also the threshold (push-notification) alerts: list, create, delete.' },
        { name: 'Mobile app: Export & sharing',
          description: 'Email a CSV export of one session — AirBeam mobile or AirBeam fixed.' },
        { name: 'Mobile app: App configuration',
          description: 'Setup data the app reads at start — the Help, AirCasting Actions and Learn more link lists, translated. Served from a config file so content changes need no app release.' },
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
