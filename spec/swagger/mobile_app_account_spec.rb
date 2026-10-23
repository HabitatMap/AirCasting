require 'swagger_helper'

# Mobile apps (iOS/Android): account & auth.
RSpec.describe 'Mobile app — account & auth', type: :request do
  # These endpoints take either scheme, both carrying the same
  # `authentication_token`: `Bearer <token>`, or HTTP Basic with the token as
  # the username and a literal `X` as the password. Every shipped build sends
  # Basic; bearer is there for new clients and matches v3. The examples sign in
  # through warden, so this header is what the docs show rather than what the
  # test authenticates with.
  let(:Authorization) { "Bearer #{user.authentication_token}" }

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
      security [{ bearer_auth: [] }, { basic_auth: [] }]
      produces 'application/json'

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

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[user],
        properties: {
          user: {
            type: :object,
            required: %w[username email password],
            properties: {
              username: { type: :string },
              email: { type: :string },
              password: { type: :string },
              password_confirmation: {
                type: :string,
                description: 'Optional, and checked only when sent — omit it and the account is ' \
                             'created. Both released apps omit it. Send it from a new client; `""` ' \
                             'counts as sent and fails to match.',
              },
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

    patch 'Update the account (email, profile name, password)' do
      tags 'Mobile app: Account & auth'
      security [{ bearer_auth: [] }, { basic_auth: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[user],
        properties: {
          user: {
            type: :object,
            properties: {
              username: { type: :string, description: 'Optional. New profile name' },
              email: { type: :string, description: 'Optional. New email address, applied immediately' },
              password: { type: :string, description: 'Optional. New password; requires `current_password` and `password_confirmation`' },
              password_confirmation: { type: :string, description: 'Must equal `password`. Required whenever `password` is sent.' },
              current_password: { type: :string, description: 'The password in force now. Required only when `password` is sent.' },
            },
          },
        },
      }

      response '200', 'updated — the full user, same shape as GET' do
        schema USER_SCHEMA
        let(:user) { create(:user) }
        let(:body) { { user: { username: 'new-profile-name' } } }
        before { sign_in user }
        run_test!
      end

      response '422', 'validation error, a wrong `current_password`, or nothing to change' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Account could not be updated' },
                 fields: ERROR_FIELDS_SCHEMA.merge(
                   example: {
                     current_password: [{ code: 'invalid', message: 'is invalid' }],
                     password: [
                       { code: 'too_short',
                         message: 'is too short (minimum is 8 characters)',
                         params: { min: 8 } },
                     ],
                   },
                 ),
               }
        let(:user) { create(:user) }
        let(:body) do
          { user: { password: 'a-new-password', password_confirmation: 'a-new-password',
                    current_password: 'wrong' } }
        end
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/api/user/settings' do
    post 'Update user settings' do
      tags 'Mobile app: Account & auth'
      security [{ bearer_auth: [] }, { basic_auth: [] }]
      consumes 'application/json'
      produces 'application/json'

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
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Settings are invalid' },
                 fields: ERROR_FIELDS_SCHEMA.merge(
                   example: {
                     session_stopped_alert: [{ code: 'missing', message: 'is missing' }],
                   },
                 ),
               }
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
      security [{ bearer_auth: [] }, { basic_auth: [] }]
      produces 'application/json'
      description 'The code expires 30 minutes after it is sent.'

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
      security [{ bearer_auth: [] }, { basic_auth: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object, required: %w[code], properties: { code: { type: :string, description: 'The code from the email' } }
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
        schema type: :object, required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Invalid or expired confirmation code.' },
               }
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
      description <<~TEXT
        `login` accepts either the email address or the profile name. Answers
        201 whether or not an account matches, so the endpoint cannot be used
        to discover which addresses are registered — a client learns nothing
        from the response either way.
      TEXT
      consumes 'application/json'
      produces 'application/json'
      security []

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[user],
        properties: {
          user: {
            type: :object,
            properties: {
              login: { type: :string, description: 'Email address or profile name. What both mobile apps send.' },
              email: { type: :string, description: 'Email address. What the web form sends; equivalent to `login`.' },
            },
          },
        },
      }

      response '201', 'request accepted — a mail is sent only if an account matched' do
        schema type: :object, description: 'Empty object'
        let(:existing) { create(:user, email: 'reset@example.com') }
        let(:body) { { user: { login: existing.email } } }
        run_test!
      end
    end
  end
end
