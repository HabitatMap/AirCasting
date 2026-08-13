# frozen_string_literal: true

Rswag::Ui.configure do |c|
  c.openapi_endpoint '/api-docs/swagger.yaml', 'AirCasting Mobile & Web API'
  # Sort endpoints alphabetically (by path) within each tag group.
  # Group (tag) order stays as declared in spec/swagger_helper.rb (no tagsSorter).
  c.config_object['operationsSorter'] = 'alpha'
end
