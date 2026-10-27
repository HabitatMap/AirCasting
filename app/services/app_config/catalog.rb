module AppConfig
  # Reads config/app_config.yml — the mobile app's setup data (link lists and
  # their translations). Nothing here touches the database; the file is the
  # source of truth so a content change is a deploy, not a migration.
  #
  # The parse is memoised. In development the file's mtime is checked on every
  # read so an edit shows up without restarting the server; in every other
  # environment it is read once per process.
  class Catalog
    PATH = Rails.root.join('config', 'app_config.yml').freeze

    class << self
      def current
        if Rails.env.development?
          mtime = ::File.mtime(PATH)
          @current = nil if @mtime != mtime
          @mtime = mtime
        end

        @current ||= new(YAML.safe_load(::File.read(PATH)))
      end
    end

    def initialize(data)
      @data = data
    end

    def default_locale
      @data.fetch('default_locale')
    end

    def supported_locales
      @data.fetch('supported_locales')
    end

    # `category` keys on the Learn more cards resolve through this map. Hoisted
    # out of the items because the same handful of labels repeat on every card
    # and each one needs seven translations.
    def categories
      @data.fetch('categories', {})
    end

    def help
      @data.fetch('help', [])
    end

    def aircasting_actions
      @data.fetch('aircasting_actions', [])
    end

    def learn_more
      @data.fetch('learn_more', [])
    end
  end
end
