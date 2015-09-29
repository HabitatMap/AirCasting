Apipie.configure do |config|
  config.app_name                = 'AirCasting'
  config.api_base_url            = ''
  config.doc_base_url            = '/api/doc'
  config.api_controllers_matcher = "#{Rails.root}/app/controllers/**/*.rb"
end
