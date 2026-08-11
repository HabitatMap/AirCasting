require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'AirCasting Mobile & Web API',
        version: '1.0.0',
        description: 'Endpoints used by the AirCasting mobile apps and web frontend. '\
                     'Spans several route namespaces (/api, /api/fixed, /api/mobile, '\
                     '/api/v3, …), not only /api/v3.',
      },
      components: {
        securitySchemes: {
          token_auth: {
            type: :apiKey,
            in: :header,
            name: 'Authorization',
            description: 'Token token=<user_token>',
          },
        },
      },
      security: [{ token_auth: [] }],
      # Tag order + descriptions control the grouping shown in Swagger UI.
      tags: [
        { name: 'Fixed sessions', description: 'AirBeam fixed (stationary) sessions: create/upload, stream detail, measurements, daily averages, and the fixed map lists (also serve government stations).' },
        { name: 'Mobile sessions', description: 'AirBeam mobile (moving) sessions: list and single stream detail.' },
        { name: 'Government stations', description: 'Government (EEA/EPA) air-quality stations from the new station_streams model: detail, measurements, daily averages, CSV export.' },
        { name: 'Map aggregations', description: 'CrowdMap grid averages, region summary, and timelapse clusters.' },
        { name: 'Autocomplete', description: 'Filter autocomplete for tag names and usernames.' },
        { name: 'Sensors & thresholds', description: 'Sensor lists and threshold sets (model-agnostic lookups).' },
        { name: 'Export & sharing', description: 'Session CSV export and short-URL creation.' },
      ],
      paths: {},
    },
  }

  config.openapi_format = :yaml
end
