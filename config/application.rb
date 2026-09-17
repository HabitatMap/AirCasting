require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

A9n.root = File.expand_path('../..', __FILE__)
A9n.load

require_relative '../lib/aircasting/bomb_server_with_measurements'
require_relative '../lib/aircasting/gzip'
require_relative '../lib/aircasting/filter_range'
require_relative '../lib/session_builder'
require_relative '../lib/aircasting/deep_symbolize'
require_relative '../lib/aircasting/time_to_local_in_utc'

module AirCasting
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    config.action_mailer.default_url_options = { host: A9n.host_ }
    config.action_controller.default_url_options = { host: A9n.host_ }

    # A controller takes the protocol from the request it is answering. A mailer
    # or a plain service object has no request, and the two settings above carry
    # no scheme, so they fell back to `http://` — putting devise's reset links
    # and the note serializers' `photo_location` on the wire in cleartext. The
    # route set's defaults are the lowest-precedence layer (`RouteSet#url_for`
    # does `default_url_options.merge(options)`), so this is a floor: an explicit
    # argument still wins, and controllers keep following the request.
    #
    # The scheme comes from `A9n.host`, which carries one; `A9n.host_` stays bare
    # because it is also the SMTP HELO domain (production.rb:76).
    Rails.application.routes.default_url_options = {
      host: A9n.host_,
      protocol: URI.parse(A9n.host.to_s).scheme,
    }.compact

    config.middleware.use Rack::Deflater
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
