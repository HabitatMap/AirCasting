require 'rails_helper'

RSpec.configure do |config|
  config.openapi_root = Rails.root.join('swagger').to_s

  config.openapi_specs = {
    'v3/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'AirCasting API V3',
        version: 'v3',
        description: 'API endpoints for AirBeamMini2 devices and mobile apps',
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
      paths: {},
    },
  }

  config.openapi_format = :yaml
end
