require 'swagger_helper'

# Web: schedule a session CSV export (emailed) and shorten a map URL.
RSpec.describe 'Exports and short URL (web)', type: :request do
  path '/api/sessions/export.json' do
    get 'Schedule a CSV export of sessions (emailed)' do
      tags 'Export & sharing'
      produces 'application/json'
      security []
      description <<~DESC
        Schedules a background CSV export of the given sessions and emails the result.
        Public (no auth). All ids must be the same kind (all mobile or all fixed) and,
        for fixed sessions, must include streams.
      DESC

      parameter name: 'session_ids[]', in: :query, required: true,
                schema: { type: :array, items: { type: :integer } },
                style: :form, explode: true, description: 'sessions.id list'
      parameter name: :email, in: :query, type: :string, required: true, description: 'Recipient email'

      response '200', 'export scheduled' do
        schema type: :string, example: 'Export scheduled successfully.'

        let(:session) { create(:mobile_session) }
        let(:stream) { create(:stream, session: session) }
        let(:'session_ids[]') { [session.id] }
        let(:email) { 'user@example.com' }

        before { stream }

        run_test!
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: true

        let(:'session_ids[]') { [] }
        let(:email) { '' }

        run_test!
      end
    end
  end

  path '/api/short_url' do
    post 'Shorten a same-host URL' do
      tags 'Export & sharing'
      consumes 'application/json'
      produces 'application/json'
      security []
      description 'Creates a shortened link for a URL on the same host. Public (no auth). Returns the shortened URL; off-host URLs are rejected with 422.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[longUrl],
        properties: {
          longUrl: { type: :string, example: 'http://www.example.com/fixed_map?foo=bar' },
        },
      }

      response '200', 'shortened' do
        schema type: :object,
               required: %w[short_url],
               properties: { short_url: { type: :string, example: 'http://www.example.com/l/abc12' } }

        let(:body) { { longUrl: 'http://www.example.com/fixed_map?foo=bar' } }
        run_test!
      end

      response '422', 'invalid or off-host URL' do
        schema type: :object,
               required: %w[error],
               properties: { error: { type: :string, example: 'Invalid URL' } }

        let(:body) { { longUrl: 'http://evil.example.org/steal' } }
        run_test!
      end
    end
  end
end
