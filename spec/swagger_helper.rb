require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'AirCasting Mobile & Web API',
        version: '1.0.0',
        description: 'Endpoints used by the AirCasting mobile apps and web frontend.'
      },
      components: {
        securitySchemes: {
          token_auth: {
            type: :apiKey,
            in: :header,
            name: 'Authorization',
            description: 'Token token=<user_token>'
          }
        }
      },
      security: [{ token_auth: [] }],
      # Tag order + descriptions control the grouping shown in Swagger UI.
      # Unified data vocabulary across the whole API:
      #   AirBeam fixed  - roof-mounted AirBeam, streams continuously over WiFi
      #                    (the old "realtime" endpoints operate on these).
      #   AirBeam mobile - AirBeam in motion, uploaded when the session finishes.
      #   Station        - government integration data (EEA / EPA), stored in the
      #                    station_streams / station_measurements model.
      # Two families: the mobile-app (iOS/Android) endpoints, then the web/v3 API.
      tags: [
        # --- Mobile apps (iOS + Android) — endpoints from docs/API_ENDPOINTS.md ---
        { name: 'Mobile app: Account & auth',
          description: 'iOS/Android: sign in/up, user settings, account deletion, password reset.' },
        { name: 'Mobile app: Sessions & sync',
          description: 'iOS/Android: upload/update AirBeam mobile sessions, sync, download session metadata, email export.' },
        { name: 'Mobile app: AirBeam fixed streaming',
          description: 'iOS/Android: create AirBeam fixed sessions and upload measurements — the new AirBeamMini binary flow (POST /api/v3/fixed_sessions[/{uuid}/measurements]) and the legacy realtime (WiFi) flow — plus poll for new measurements.' },
        { name: 'Mobile app: Fixed map & streams',
          description: 'iOS/Android: active AirBeam fixed sessions in a bounding box, fixed session/stream detail with measurements.' },
        { name: 'Mobile app: Threshold alerts',
          description: 'iOS/Android: manage threshold (push-notification) alerts.' },
        # --- Web frontend ---
        { name: 'Web app: Fixed sessions',
          description: 'Web frontend: AirBeam fixed (roof-mounted) stream detail, measurements, daily averages, and the fixed map lists (these lists also carry Station/government data).' },
        { name: 'Web app: Mobile sessions',
          description: 'Web frontend: AirBeam mobile (moving) session list and single stream detail.' },
        { name: 'Web app: Station data (government)',
          description: 'Web frontend: Station data — government (EEA/EPA) integration, in the station_streams / station_measurements model: station stream detail, measurements, daily averages, CSV export.' },
        { name: 'Web app: Map aggregations',
          description: 'Web frontend: CrowdMap grid averages, region summary, timelapse clusters.' },
        { name: 'Web app: Autocomplete',
          description: 'Web frontend: filter autocomplete for tag names and usernames.' },
        { name: 'Web app: Sensors & thresholds',
          description: 'Web frontend: sensor lists and threshold sets. (Mobile apps do not call these — they receive threshold values embedded in session/stream responses.)' },
        { name: 'Web app: Export & sharing',
          description: 'Web frontend: session CSV export and short-URL creation.' }
      ],
      paths: {}
    }
  }

  config.openapi_format = :yaml
end
