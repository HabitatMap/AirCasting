require 'swagger_helper'

# Mobile apps (iOS/Android): account & auth.
RSpec.describe 'Mobile app — account & auth', type: :request do
  # Satisfies the global token_auth security scheme on authenticated operations
  # (no-auth ops set `security []`, so this is never evaluated there).
  let(:Authorization) { "Token token=#{user.authentication_token}" }

  USER_SCHEMA = {
    type: :object,
    required: %w[id email username authentication_token session_stopped_alert],
    properties: {
      id: { type: :integer },
      email: { type: :string },
      username: { type: :string },
      authentication_token: { type: :string, description: 'API token; sent back as the HTTP Basic username on authenticated requests' },
      session_stopped_alert: { type: :boolean },
    },
  }.freeze

  path '/api/user.json' do
    get 'Sign in (fetch the current user)' do
      tags 'Mobile app: Account & auth'
      produces 'application/json'
      description 'Returns the authenticated user. Auth: `Token token=<user_token>` via HTTP Basic (token as username, "X" as password).'

      response '200', 'user' do
        schema USER_SCHEMA
        let(:user) { create(:user) }
        before { sign_in user }
        run_test!
      end
    end

    post 'Sign up (create an account)' do
      tags 'Mobile app: Account & auth'
      consumes 'application/json'
      produces 'application/json'
      security []
      description 'Creates a new user account. No auth.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[user],
        properties: {
          user: {
            type: :object,
            required: %w[username email password password_confirmation],
            properties: {
              username: { type: :string },
              email: { type: :string },
              password: { type: :string },
              password_confirmation: { type: :string },
              send_emails: { type: :boolean, nullable: true },
            },
          },
        },
      }

      response '201', 'created' do
        schema USER_SCHEMA
        let(:body) do
          { user: { username: 'newuser', email: 'newuser@example.com',
                    password: 'password123', password_confirmation: 'password123' } }
        end
        run_test!
      end

      response '422', 'validation error' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }
        let(:body) { { user: { username: '', email: 'bad' } } }
        run_test!
      end
    end
  end

  path '/api/user/settings' do
    post 'Update user settings' do
      tags 'Mobile app: Account & auth'
      consumes 'application/json'
      produces 'application/json'
      description 'Updates the `session_stopped_alert` preference. Auth required.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[data],
        properties: {
          data: {
            type: :object,
            required: %w[session_stopped_alert],
            properties: { session_stopped_alert: { type: :boolean } },
          },
        },
      }

      response '200', 'updated' do
        schema type: :object, required: %w[action],
               properties: { action: { type: :string, example: 'session_stopped_alert was set to true' } }
        let(:user) { create(:user) }
        let(:body) { { data: { session_stopped_alert: true } } }
        before { sign_in user }
        run_test!
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }
        let(:user) { create(:user) }
        let(:body) { { data: {} } }
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/api/user/delete_account_send_code' do
    post 'Send account-deletion confirmation code (email)' do
      tags 'Mobile app: Account & auth'
      produces 'application/json'
      description 'Emails a 4-digit confirmation code (valid 30 minutes) to the current user. Auth required. Empty 200 body.'

      response '200', 'code sent' do
        let(:user) { create(:user) }
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/api/user/delete_account_confirm' do
    post 'Confirm account deletion with code' do
      tags 'Mobile app: Account & auth'
      consumes 'application/json'
      produces 'application/json'
      description 'Deletes the account if the supplied `code` matches and is unexpired. Auth required.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object, required: %w[code], properties: { code: { type: :string, example: '0042' } }
      }

      response '200', 'account deleted' do
        schema type: :object, required: %w[message],
               properties: { message: { type: :string, example: 'Account successfully deleted.' } }
        let(:user) { create(:user, deletion_confirmation_code: '0042', deletion_code_valid_until: 10.minutes.from_now) }
        let(:body) { { code: '0042' } }
        before { sign_in user }
        run_test!
      end

      response '401', 'invalid or expired code' do
        schema type: :object, required: %w[error],
               properties: { error: { type: :string, example: 'Invalid or expired confirmation code.' } }
        let(:user) { create(:user, deletion_confirmation_code: '0042', deletion_code_valid_until: 10.minutes.from_now) }
        let(:body) { { code: '9999' } }
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/users/password.json' do
    post 'Request a password-reset email' do
      tags 'Mobile app: Account & auth'
      consumes 'application/json'
      produces 'application/json'
      security []
      description 'Sends password-reset instructions to the given email (Devise). No auth. Note: this path has no /api prefix.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[user],
        properties: { user: { type: :object, required: %w[email], properties: { email: { type: :string } } } },
      }

      response '201', 'reset email sent' do
        schema type: :object, description: 'Empty object'
        let(:existing) { create(:user, email: 'reset@example.com') }
        let(:body) { { user: { email: existing.email } } }
        run_test!
      end
    end
  end
end
