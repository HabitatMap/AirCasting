require 'rails_helper'

# The Devise screens had no spec at all — nothing checked that they render,
# that they use the auth layout rather than the map's, or that the flash and
# the error partials reach the page. The restyle added a layout, a flash
# partial and two error partials, none of which anything else exercises.
describe 'the account screens', type: :request do
  let(:password) { 'password123' }

  let!(:user) do
    User.create!(
      username: 'holder',
      email: 'holder@example.com',
      password: password,
      password_confirmation: password,
    )
  end

  describe 'rendering' do
    {
      'sign in' => '/users/sign_in',
      'sign up' => '/users/sign_up',
      'forgot password' => '/users/password/new',
    }.each do |name, path|
      it "renders the #{name} screen through the auth layout" do
        get path

        expect(response).to have_http_status(:ok)
        # Haml emits single-quoted attributes, ERB double-quoted.
        expect(response.body).to match(/class=['"]auth-page['"]/)
        expect(response.body).to include('auth-card')
      end

      it "loads the auth stylesheet and not the map bundle on #{name}" do
        get path

        expect(response.body).to include('css/auth')
        expect(response.body).not_to include('css/react-app')
      end
    end

    # The password reveal toggles are built in JS; if the `auth` entry ever
    # stops emitting a js asset, `webpack_asset_urls` raises in the layout and
    # every one of these screens 500s, so the tag is worth pinning.
    it 'loads the auth script, deferred, on the sign-in screen' do
      get '/users/sign_in'

      expect(response.body).to match(%r{<script src="[^"]*packs/auth[^"]*\.js" defer})
    end

    it 'renders the change-password screen when a token is in the query' do
      token = user.send_reset_password_instructions

      get "/users/password/edit?reset_password_token=#{token}"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Choose a new password')
      expect(response.body).to include(token)
    end

    it 'puts the reset window on the forgot-password screen' do
      get '/users/password/new'

      # Devise.reset_password_within is 6.hours; the copy has to track it.
      expect(response.body).to include('6 hours')
    end

    it 'states the real minimum password length on sign up' do
      get '/users/sign_up'

      expect(Devise.password_length.min).to eq(8)
      expect(response.body).to include('8 characters')
    end
  end

  describe 'the flash, which nothing in this app rendered before' do
    it 'shows the failed-login alert on the sign-in screen' do
      post user_session_path, params: { user: { email: user.email, password: 'wrong' } }
      # A plain GET, not follow_redirect!: the latter drops the flash that the
      # Warden failure app set, which is a harness artefact, not app behaviour.
      get new_user_session_path

      expect(response.body).to include('auth-alert--error')
      expect(response.body).to include('Incorrect email or password. Please try again.')
    end

    it 'shows the reset-sent notice as a success alert' do
      post user_password_path, params: { user: { login: user.email } }
      get new_user_session_path

      expect(response.body).to include('auth-alert--success')
      expect(response.body).to include('You will receive an email with instructions')
    end

    it 'renders the alert inside the card, above the form' do
      post user_session_path, params: { user: { email: user.email, password: 'wrong' } }
      get new_user_session_path

      card = response.body.index('auth-card')
      alert = response.body.index('auth-alert--error')
      form = response.body.index('<form')

      expect([card, alert, form]).to all(be_present)
      expect(card).to be < alert
      expect(alert).to be < form
    end
  end

  describe 'validation errors' do
    it 'shows the confirmation mismatch under the field, in the design wording' do
      post user_registration_path,
           params: {
             user: {
               email: 'new@example.com',
               username: 'fresh',
               password: password,
               password_confirmation: 'something-else',
             },
           }

      # 200, not 422: `config.responder.error_status` is left commented out in
      # config/initializers/devise.rb, so Devise's responder keeps its
      # backwards-compatible :ok. Pinned as-is rather than silently changed.
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Doesn&#39;t match the password above')
      expect(response.body).to include('password_confirmation_error')
    end

    it 'marks the field invalid and points at its message for screen readers' do
      post user_registration_path,
           params: { user: { email: 'bad', username: '', password: 'x', password_confirmation: 'x' } }

      expect(response.body).to include('aria-invalid="true"')
      expect(response.body).to include('aria-describedby="email_error"')
    end

    # An expired or tampered token belongs to a hidden field, so it can only be
    # reported by the form-level summary. That is the whole reason the summary
    # partial exists.
    it 'surfaces a bad reset token in the form-level summary' do
      put user_password_path,
          params: {
            user: {
              reset_password_token: 'not-a-real-token',
              password: 'newpassword1',
              password_confirmation: 'newpassword1',
            },
          }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('role="alert"')
      expect(response.body).to include('Reset password token is invalid')
    end

    it 'does not repeat an inline message in the summary' do
      post user_registration_path,
           params: {
             user: {
               email: user.email,
               username: 'fresh',
               password: password,
               password_confirmation: password,
             },
           }

      expect(response.body).to have_text_once('Email has already been taken')
    end
  end

  describe 'links' do
    it 'offers sign-up from the sign-in screen and vice versa' do
      get new_user_session_path
      expect(response.body).to include(new_user_registration_path)

      get new_user_registration_path
      expect(response.body).to include(new_user_session_path)
    end

    # The User model enables neither :confirmable nor :lockable, so these
    # routes do not exist; the partial must not try to link to them.
    it 'links to no confirmation or unlock route' do
      get new_user_session_path

      expect(response.body).not_to include('confirmation')
      expect(response.body).not_to include('unlock')
    end
  end
end

RSpec::Matchers.define :have_text_once do |needle|
  match { |body| body.scan(needle).length == 1 }

  failure_message do |body|
    "expected #{needle.inspect} exactly once, found #{body.scan(needle).length}"
  end
end
