require 'rails_helper'

describe 'GET /api/v3/app_config' do
  let(:row_keys) { %w[title url] }
  let(:card_keys) { %w[post_slug title category url thumbnail_url] }
  let(:supported_locales) { AppConfig::Catalog.current.supported_locales }

  def get_config(query = '')
    get "/api/v3/app_config#{query}"
    JSON.parse(response.body)
  end

  it 'returns every list in English by default' do
    body = get_config

    expect(response.status).to eq(200)
    expect(body['locale']).to eq('en-US')
    expect(body['default_locale']).to eq('en-US')
    expect(body['help']).to be_an(Array)
    expect(body['aircasting_actions']).to be_an(Array)
    expect(body['learn_more']).to be_an(Array)
  end

  it 'needs no authentication' do
    get '/api/v3/app_config'

    expect(response.status).to eq(200)
  end

  it 'returns every documented key on every item' do
    body = get_config

    (body['help'] + body['aircasting_actions']).each do |item|
      expect(item.keys).to match_array(row_keys)
    end
    body['learn_more'].each { |item| expect(item.keys).to match_array(card_keys) }
  end

  # These are the fields a client cannot render without. iOS fails the whole
  # decode on a null where it expects a string, so an untranslated or
  # half-filled entry in the config file has to fail here, not on a phone.
  it 'never returns a null title or url, in any supported locale' do
    supported_locales.each do |locale|
      body = get_config("?locale=#{locale}")

      (body['help'] + body['aircasting_actions'] + body['learn_more']).each do |item|
        expect(item['title']).to be_present, "#{locale}: #{item['url']} has no title"
        expect(item['url']).to be_present, "#{locale}: an item has no url"
      end
    end
  end

  # Only that the serializer passes it through. Whether the value is *right* —
  # matching the URL slug, unique across cards — is a property of the config
  # file, so spec/services/app_config/catalog_spec.rb owns it and names every
  # offender at once.
  it 'serves a post_slug on every card' do
    expect(get_config['learn_more'].map { |card| card['post_slug'] }).to all(be_present)
  end

  it 'does not invent an identifier for non-article rows' do
    body = get_config

    (body['help'] + body['aircasting_actions']).each do |row|
      expect(row).not_to have_key('post_slug')
    end
  end

  # Looked up by slug, not by position: the order of the cards in the YAML is
  # display order and content editors reorder it.
  it 'resolves a category key to its translated label' do
    slug = 'think-your-air-is-clean-check-again'
    card = ->(locale) do
      get_config("?locale=#{locale}")['learn_more'].find do |c|
        c['post_slug'] == slug
      end
    end

    expect(card.call('en-US')['category']).to eq('News')
    expect(card.call('fr')['category']).to eq('Actualités')
  end

  it 'translates the titles for a requested locale' do
    spanish = get_config('?locale=es')
    english = get_config('?locale=en-US')

    expect(spanish['locale']).to eq('es')
    expect(spanish['aircasting_actions'].map { |i| i['title'] }).not_to eq(
      english['aircasting_actions'].map { |i| i['title'] },
    )
    expect(spanish['aircasting_actions'].map { |i| i['url'] }).to eq(
      english['aircasting_actions'].map { |i| i['url'] },
    )
  end

  it 'matches a supported locale whatever case it is asked for in' do
    expect(get_config('?locale=EN-gb')['locale']).to eq('en-GB')
  end

  # en-GB is deliberately never translated in the config file — every string
  # falls through to en-US one at a time. Asserting it here keeps the fallback
  # honest without pinning the spec to which other languages are finished today.
  it 'serves the default locale strings for a locale with no translations' do
    british = get_config('?locale=en-GB')
    american = get_config('?locale=en-US')

    expect(british['locale']).to eq('en-GB')
    expect(british.slice('help', 'aircasting_actions', 'learn_more')).to eq(
      american.slice('help', 'aircasting_actions', 'learn_more'),
    )
  end

  # No narrowing and no header sniffing: a tag the config file does not list is
  # simply the default. `pt-BR` is not `pt` here, on purpose.
  it 'falls back to the default locale for anything it does not list' do
    expect(get_config('?locale=pl')['locale']).to eq('en-US')
    expect(get_config('?locale=pt-BR')['locale']).to eq('en-US')
    expect(get_config('?locale=')['locale']).to eq('en-US')
    expect(response.status).to eq(200)
  end
end
