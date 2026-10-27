module Api
  module V3
    # Setup data the mobile apps read at start: the Help rows, the AirCasting
    # Actions rows and the Learn more cards. It exists so changing a link or a
    # title is an API deploy rather than a new app release. Served from
    # config/app_config.yml — there is nothing user-specific in it, so there is
    # no authentication.
    class AppConfigController < BaseController
      CACHE_MAX_AGE = 15.minutes

      def show
        catalog = ::AppConfig::Catalog.current

        expires_in CACHE_MAX_AGE, public: true

        render json:
                 AppConfigSerializer.new(
                   catalog: catalog,
                   locale: locale_for(catalog),
                 ).call
      end

      private

      # Either the caller names a locale the config file actually has, or they
      # get the default. No header sniffing and no narrowing: `pt-BR` is not
      # `pt` here, so a client has to send the bare language code it resolved
      # for its own UI, never the raw platform identifier — iOS
      # `Locale.current.identifier` is `es_MX`, Android `toLanguageTag()` is
      # `pt-BR`, and both would land silently on English.
      def locale_for(catalog)
        asked = params[:locale].to_s.strip

        catalog.supported_locales.find { |l| l.casecmp?(asked) } ||
          catalog.default_locale
      end
    end
  end
end
