require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

A9n.root = File.expand_path('../..', __FILE__)
A9n.load

require_relative '../lib/aircasting/auth_failure_app'
require_relative '../lib/aircasting/gzip'
require_relative '../lib/aircasting/filter_range'
require_relative '../lib/session_builder'
require_relative '../lib/realtime_measurement_builder'
require_relative '../lib/aircasting/deep_symbolize'
require_relative '../lib/aircasting/time_to_local_in_utc'

module AirCasting
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # App host
    config.action_mailer.default_url_options = { :host => A9n.host_ }
    config.action_controller.default_url_options = { :host => A9n.host_ }

    # Wrap fields with errors with spans
    config.action_view.field_error_proc = Proc.new { |html_tag, instance| %(<span class="fieldWithErrors">#{html_tag}</span>).html_safe }

    config.active_record.include_root_in_json = false

    config.log_tags = [:uuid]
  end
end

# Monkey patch BigDecimal#as_json to return floats and not strings.
# This should be removed so that Rails returns BigDecimals as strings.
# At the moment it's not possible because the mobile and webapp rely on
# bigints being floats (and not strings).
# See https://github.com/rails/rails/issues/25017
class BigDecimal
  def as_json(*)
    to_f
  end
end
