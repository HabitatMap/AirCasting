require 'swagger_helper'

# Mobile app setup data: the three link lists shown on the home screen — Help,
# AirCasting Actions and Learn more — with the titles translated. Backed by
# config/app_config.yml, not the database.
#
# Constants live in a module rather than in the example group: a constant
# assigned inside `RSpec.describe` is defined on Object, which both warns on
# reload and lets two spec files silently overwrite each other's schema.
module AppConfigDocs
  SUPPORTED_LOCALES = AppConfig::Catalog.current.supported_locales.freeze

  ROW = {
    type: :object,
    required: %w[title url],
    properties: {
      title: { type: :string, example: 'FAQ' },
      url: { type: :string, example: 'https://www.habitatmap.org/airbeam/faq' },
    },
  }.freeze

  SCHEMA = {
    type: :object,
    required: %w[locale default_locale help aircasting_actions learn_more],
    properties: {
      locale: {
        type: :string,
        enum: AppConfigDocs::SUPPORTED_LOCALES,
        description:
          'The locale actually served. May differ from what was asked for — ' \
          'an unsupported language falls back rather than failing.',
        example: 'es',
      },
      default_locale: {
        type: :string,
        description: 'The locale an untranslated string falls back to.',
        example: 'en-US',
      },
      help: {
        type: :array,
        description:
          'The "Help" rows, in display order. Same shape as the AirCasting ' \
          'Actions rows.',
        items: AppConfigDocs::ROW,
      },
      aircasting_actions: {
        type: :array,
        description: 'The "AIRCASTING ACTIONS" rows, in display order.',
        items: AppConfigDocs::ROW,
      },
      learn_more: {
        type: :array,
        description: 'The "Learn more" cards, in display order.',
        items: {
          type: :object,
          required: %w[post_slug title category url thumbnail_url],
          properties: {
            post_slug: {
              type: :string,
              description:
                "The HabitatMap post's URL slug. Send it as the `post_slug` " \
                'event parameter when the card is shown or tapped, and as ' \
                '`ac_post` on the outbound link, so mobile taps join to the ' \
                'same GA4 series as the web banner. It is the last path ' \
                'segment of `url`, but do not recompute it — use this value.',
              example:
                'what-do-those-colored-circles-mean-understanding-air-quality-on-the-aircasting-map',
            },
            title: {
              type: :string,
              example:
                'What Do Those Colored Dots Mean? Understanding the Air Quality Index (AQI)',
            },
            category: {
              type: :string,
              nullable: true,
              description:
                'Small label above the title, e.g. "News". Translated. Null ' \
                'when the card has none.',
              example: 'News',
            },
            url: {
              type: :string,
              example:
                'https://www.habitatmap.org/blog/what-do-those-colored-circles-mean-understanding-air-quality-on-the-aircasting-map',
            },
            thumbnail_url: {
              type: :string,
              nullable: true,
              description:
                'Card thumbnail, already cropped and compressed server-side — ' \
                'square, 192x192, WebP, a few kB. Render it as-is; do not ask ' \
                'for another size. Null when the card has none.',
              example:
                'https://www.habitatmap.org/.netlify/images?url=/images/uploads/aircastingmapdots.png&w=192&h=192&fit=cover&fm=webp&q=70',
            },
          },
        },
      },
    },
  }.freeze
end

RSpec.describe 'V3 App configuration', type: :request do
  path '/api/v3/app_config' do
    get 'App setup data (link lists, translated)' do
      tags 'Mobile app: App configuration'
      produces 'application/json'
      security []

      parameter name: :locale,
                in: :query,
                required: false,
                schema: {
                  type: :string,
                  enum: AppConfigDocs::SUPPORTED_LOCALES,
                },
                description:
                  'The bare language code'

      response '200', 'The link lists for the resolved locale' do
        schema AppConfigDocs::SCHEMA

        let(:locale) { 'es' }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body['locale']).to eq('es')
          expect(body['aircasting_actions']).to be_an(Array)
          expect(body['learn_more']).to be_an(Array)
        end
      end
    end
  end
end
