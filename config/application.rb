# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# You can contact the authors by email at <info@habitatmap.org>

require File.expand_path('../boot', __FILE__)

require 'rails/all'
require 'elasticsearch/rails/instrumentation'

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(:assets => %w(development test)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

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

    # Custom directories with classes and modules you want to be autoloadable.
   # config.autoload_paths += %W(#{config.root}/lib/aircasting)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :measurement_observer

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

    # Observers
    config.active_record.observers = ['Elastic::StreamObserver']
  end
end
