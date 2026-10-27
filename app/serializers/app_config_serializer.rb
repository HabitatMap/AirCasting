# The GET /api/v3/app_config body. Every key is always present — `null` where a
# value is genuinely absent — because Swift's Codable fails the whole decode on
# a missing key, and these lists are read at app start.
#
# One instance serves one locale: AppConfigSerializer.new(catalog:, locale:).call
class AppConfigSerializer
  def initialize(catalog:, locale:)
    @catalog = catalog
    @locale = locale
  end

  def call
    {
      locale: @locale,
      default_locale: @catalog.default_locale,
      help: @catalog.help.map { |item| row(item) },
      aircasting_actions: @catalog.aircasting_actions.map { |item| row(item) },
      learn_more: @catalog.learn_more.map { |item| card(item) },
    }
  end

  private

  # A Help or AirCasting Actions row: a title and a chevron.
  def row(item)
    { title: translate(item['title']), url: translate(item['url']) }
  end

  def card(item)
    {
      # The HabitatMap post's own URL slug — the GA4 join key shared with
      # HabitatMap and with the web map's InfoBanner. Never derived from the
      # URL; see config/app_config.yml.
      post_slug: item['post_slug'],
      title: translate(item['title']),
      category: category(item),
      url: translate(item['url']),
      thumbnail_url: translate(item['thumbnail_url']),
    }
  end

  # `category` is a key into the catalog's shared label map. A value that is not
  # a known key is passed through as a literal, so a one-off label still works.
  def category(item)
    key = item['category']
    return if key.nil?

    translate(@catalog.categories.fetch(key, key))
  end

  # A config value is either a scalar — the same in every language — or a
  # `locale => value` map that need not be complete. A missing *or empty*
  # translation falls back to the default locale: an empty string is a
  # half-finished entry, not a deliberate blank, and iOS renders it as a blank
  # row rather than failing loudly.
  def translate(value)
    return value unless value.is_a?(Hash)

    value[@locale].presence || value[@catalog.default_locale]
  end
end
