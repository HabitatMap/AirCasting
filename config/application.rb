require File.expand_path('../boot', __FILE__)

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

A9n.root = File.expand_path('../..', __FILE__)
A9n.load

require_relative '../lib/app_config'
require_relative '../lib/aircasting/auth_failure_app'
require_relative '../lib/aircasting/gzip'
require_relative '../lib/aircasting/filter_range'
require_relative '../lib/session_builder'
require_relative '../lib/realtime_measurement_builder'
require_relative '../lib/aircasting/deep_symbolize'
require_relative '../lib/aircasting/time_to_local_in_utc'

module AirCasting
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'

    # App host
    config.action_mailer.default_url_options = { :host => AppConfig.host }
    config.action_controller.default_url_options = { :host => AppConfig.host }

    # Wrap fields with errors with spans
    config.action_view.field_error_proc = Proc.new { |html_tag, instance| %(<span class="fieldWithErrors">#{html_tag}</span>).html_safe }

    config.active_record.include_root_in_json = false

    config.assets.precompile += %w( active_admin.css active_admin.js active_admin/print.css )
    config.log_tags = [:uuid]

    config.secrets = YAML.load_file(Rails.root.join('config', 'secrets.yml'))

    config.middleware.insert_before 0, "Rack::Cors", debug: false, logger: (-> { Rails.logger } ) do
      allow do
        origins '*'

        resource '/api/*',
          headers: :any,
          methods: [:get, :post, :patch, :delete, :put, :options, :head],
          max_age: 0

        resource '/autocomplete/*',
          headers: :any,
          methods: [:get, :post, :patch, :delete, :put, :options, :head],
          max_age: 0

      end
    end
  end
end
