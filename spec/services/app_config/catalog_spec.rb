require 'rails_helper'

# These run against the real config/app_config.yml, not a fixture. Everything
# here is a typo that the endpoint would otherwise swallow: a mistyped locale
# key is simply never served, and a mistyped category key is passed through to
# the phone as a literal. Both look fine in a 200 response.
#
# Constants live in a module named after this spec, not in the example group:
# a constant assigned inside `describe` is defined on Object, so a name as
# generic as LISTS would be one `rspec spec/` away from colliding with another
# file's.
module AppConfigCatalogSpec
  LISTS = %w[help aircasting_actions learn_more].freeze
  TRANSLATABLE = %w[title url thumbnail_url].freeze
end

describe AppConfig::Catalog do
  subject(:catalog) { described_class.current }

  def items(list)
    catalog.public_send(list).each_with_index.map { |item, i| ["#{list}[#{i}]", item] }
  end

  def all_items
    AppConfigCatalogSpec::LISTS.flat_map { |list| items(list) }
  end

  it 'has a default locale that is itself supported' do
    expect(catalog.supported_locales).to include(catalog.default_locale)
  end

  it 'uses only supported locales as translation keys' do
    offenders =
      all_items.flat_map do |label, item|
        AppConfigCatalogSpec::TRANSLATABLE.flat_map do |field|
          value = item[field]
          next [] unless value.is_a?(Hash)

          (value.keys - catalog.supported_locales).map do |bad|
            "#{label}.#{field}: #{bad}"
          end
        end
      end

    expect(offenders).to eq([])
  end

  it 'gives every translated field an entry for the default locale' do
    offenders =
      all_items.flat_map do |label, item|
        AppConfigCatalogSpec::TRANSLATABLE.filter_map do |field|
          value = item[field]
          next unless value.is_a?(Hash)
          next if value[catalog.default_locale].present?

          "#{label}.#{field}"
        end
      end

    expect(offenders).to eq([])
  end

  it 'gives every item a title and a url' do
    offenders =
      all_items.filter_map do |label, item|
        label unless item['title'].present? && item['url'].present?
      end

    expect(offenders).to eq([])
  end

  describe 'categories' do
    # A label may be a bare string — a product name is the same in every
    # language — in which case there is no locale key to check.
    it 'uses only supported locales as keys, including the default' do
      offenders =
        catalog
          .categories
          .select { |_key, labels| labels.is_a?(Hash) }
          .flat_map do |key, labels|
            (labels.keys - catalog.supported_locales).map { |bad| "#{key}: #{bad}" } +
              (labels[catalog.default_locale].present? ? [] : ["#{key}: no default"])
          end

      expect(offenders).to eq([])
    end

    it 'is referenced only by keys that exist' do
      offenders =
        catalog.learn_more.filter_map do |card|
          key = card['category']
          next if key.nil? || catalog.categories.key?(key)

          "#{card['post_slug']}: #{key}"
        end

      expect(offenders).to eq([])
    end
  end

  describe 'learn more cards' do
    it 'carries a post_slug equal to the last path segment of its url' do
      offenders =
        catalog.learn_more.filter_map do |card|
          expected = URI.parse(card['url']).path.split('/').last
          "#{card['post_slug']} != #{expected}" if card['post_slug'] != expected
        end

      expect(offenders).to eq([])
    end

    it 'does not repeat a post_slug' do
      slugs = catalog.learn_more.map { |card| card['post_slug'] }

      expect(slugs.tally.select { |_slug, count| count > 1 }.keys).to eq([])
    end
  end
end
