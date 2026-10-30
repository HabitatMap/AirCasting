require 'rails_helper'

# `POST /users/password.json` is the forgot-password endpoint both mobile apps
# call. Android sends `{user: {login: …}}` (ForgotPasswordParams.kt) and iOS
# sends the same key (EmailResetPasswordService.swift); the web form sends
# `{user: {email: …}}`. All three land here.
describe 'POST /users/password.json', type: :request do
  let!(:user) do
    FactoryBot.create(:user, email: 'reset@example.com', username: 'resetme')
  end

  before { ActionMailer::Base.deliveries.clear }

  def deliveries
    ActionMailer::Base.deliveries
  end

  describe 'a login that matches an account' do
    it 'sends one mail when the login is the email' do
      post '/users/password.json', params: { user: { login: user.email } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries.size).to eq(1)
      expect(deliveries.last.to).to eq([user.email])
    end

    it 'sends one mail when the login is the username' do
      post '/users/password.json', params: { user: { login: user.username } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries.size).to eq(1)
      expect(deliveries.last.to).to eq([user.email])
    end

    it 'sends one mail for the web form shape' do
      post '/users/password.json', params: { user: { email: user.email } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries.size).to eq(1)
    end

    it 'matches the email case-insensitively' do
      post '/users/password.json', params: { user: { login: 'RESET@EXAMPLE.COM' } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries.size).to eq(1)
    end
  end

  # Each of these used to raise inside the controller and answer 500, so the
  # apps showed a generic error and nothing was sent. They now take the same
  # path as a hit, which also stops the endpoint reporting which logins exist.
  describe 'a login that matches nothing' do
    it 'answers 201 and sends nothing for an unknown login' do
      post '/users/password.json', params: { user: { login: 'nobody@example.com' } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries).to be_empty
    end

    it 'answers 201 and sends nothing for a blank login' do
      post '/users/password.json', params: { user: { login: '' } }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries).to be_empty
    end

    it 'answers 201 and sends nothing when neither login nor email is given' do
      post '/users/password.json', params: { user: {} }, as: :json

      expect(response).to have_http_status(:created)
      expect(deliveries).to be_empty
    end

    it 'is indistinguishable from a hit' do
      post '/users/password.json', params: { user: { login: user.email } }, as: :json
      hit = [response.status, response.body]

      post '/users/password.json', params: { user: { login: 'nobody@example.com' } }, as: :json
      miss = [response.status, response.body]

      expect(miss).to eq(hit)
    end
  end

  describe 'the mail itself' do
    before do
      post '/users/password.json', params: { user: { login: user.email } }, as: :json
    end

    let(:mail) { deliveries.last }

    it 'carries both a plain-text and an HTML part' do
      expect(mail).to be_multipart
      expect(mail.parts.map(&:mime_type)).to contain_exactly('text/plain', 'text/html')
    end

    it 'puts the reset link in both parts' do
      token = user.reload.reset_password_token
      expect(token).to be_present

      mail.parts.each do |part|
        expect(part.body.to_s).to include('/users/password/edit?reset_password_token=')
      end
    end

    # The `mail` gem otherwise derives this from Socket.gethostname, which on
    # the production box is `localhost` — see the interceptor's own spec.
    it 'stamps a Message-ID on the sending domain' do
      expect(mail.message_id).to end_with("@#{A9n.host_.to_s.split(':').first}")
    end
  end
end

# Devise checks the reset token on PUT only; `edit` used to render the form for
# any string, so a dead link looked live until the user had chosen a password
# and typed it twice. PasswordsController#edit now checks it up front.
describe 'GET /users/password/edit', type: :request do
  let!(:user) do
    FactoryBot.create(:user, email: 'expiry@example.com', username: 'expiry')
  end

  let(:token) { user.send_reset_password_instructions }

  def expired?
    response.body.include?('This reset link has expired')
  end

  it 'renders the password form while the token is live' do
    get "/users/password/edit?reset_password_token=#{token}"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('Choose a new password')
    expect(expired?).to be(false)
  end

  # Devise.reset_password_within is 6.hours.
  it 'shows the expired state once the token is past its window' do
    token
    user.update_column(:reset_password_sent_at, 7.hours.ago)

    get "/users/password/edit?reset_password_token=#{token}"

    expect(response).to have_http_status(:ok)
    expect(expired?).to be(true)
    expect(response.body).to include('auth-badge--warning')
  end

  it 'offers a form that posts straight back to the reset endpoint' do
    token
    user.update_column(:reset_password_sent_at, 7.hours.ago)

    get "/users/password/edit?reset_password_token=#{token}"

    expect(response.body).to include("action=\"#{user_password_path}\"")
    expect(response.body).to include('Send a new link')
  end

  # A token that never existed and one that has expired must look identical,
  # or the screen tells an attacker which of their guesses was a real token.
  it 'answers a garbage token with the same screen' do
    get '/users/password/edit?reset_password_token=not-a-real-token'

    expect(response).to have_http_status(:ok)
    expect(expired?).to be(true)
  end

  it 'leaves the no-token case to Devise, which bounces to sign in' do
    get '/users/password/edit'

    expect(response).to redirect_to(new_user_session_path)
  end

  # The PUT-side check is Devise's and still has to catch a token that dies
  # between this GET and the submit.
  it 'still refuses an expired token on submit' do
    token
    user.update_column(:reset_password_sent_at, 7.hours.ago)

    put '/users/password',
        params: {
          user: {
            reset_password_token: token,
            password: 'brandnew123',
            password_confirmation: 'brandnew123',
          },
        }

    expect(user.reload.valid_password?('brandnew123')).to be(false)
    expect(response.body).to include('expired')
  end
end

# Devise ends both halves of a reset somewhere else — `create` redirects to the
# sign-in form with a flash, `update` signs the user in and drops them on the
# map. Neither is useful to someone who started in a mail app on a phone, which
# is nearly everyone. Figma frames 06 and 09 give those two moments a screen.
describe 'the screens either side of a reset', type: :request do
  let!(:user) do
    FactoryBot.create(:user, email: 'flow@example.com', username: 'flowuser')
  end

  describe 'GET /users/password/sent' do
    it 'is where a browser lands after asking for a link' do
      post user_password_path, params: { user: { login: user.email } }

      expect(response).to redirect_to(password_sent_path)
    end

    it 'names the address back to the user' do
      post user_password_path, params: { user: { login: user.email } }
      follow_redirect!

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Check your email')
      expect(response.body).to include(user.email)
    end

    # Same page for a login that matches nothing, like every other step of this
    # flow — see User.send_reset_password_instructions.
    it 'says the same thing for an address with no account' do
      post user_password_path, params: { user: { login: 'nobody@example.com' } }
      follow_redirect!

      expect(response.body).to include('Check your email')
      expect(response.body).to include('nobody@example.com')
    end

    it 'takes the web form shape too, which sends email rather than login' do
      post user_password_path, params: { user: { email: user.email } }
      follow_redirect!

      expect(response.body).to include(user.email)
    end

    it 'escapes the address it echoes' do
      post user_password_path, params: { user: { login: '<script>x</script>' } }
      follow_redirect!

      expect(response.body).not_to include('<script>x</script>')
      expect(response.body).to include('&lt;script&gt;')
    end

    it 'resends to the same address without asking for it again' do
      post user_password_path, params: { user: { login: user.email } }
      follow_redirect!

      expect(response.body).to include('Send it again')
      expect(response.body).to include(%(name="user[login]"))
      # A POST, not a link: a GET that sends mail is retried by anything that
      # prefetches, and the address would sit in the URL.
      expect(response.body).to include(%(action="#{user_password_path}"))
      expect(response.body).to include(%(method="post"))
    end

    it 'sends a visitor with nothing in the session back to the form' do
      get password_sent_path

      expect(response).to redirect_to(new_user_password_path)
    end
  end

  describe 'GET /users/password/updated' do
    let(:token) { user.send_reset_password_instructions }

    def reset!
      put user_password_path,
          params: {
            user: {
              reset_password_token: token,
              password: 'brandnewpass1',
              password_confirmation: 'brandnewpass1',
            },
          }
    end

    it 'is where a browser lands after the password changes' do
      reset!

      expect(response).to redirect_to(password_updated_path)
      expect(user.reload.valid_password?('brandnewpass1')).to be(true)
    end

    it 'confirms the change and offers the map, with no way back to sign-in' do
      reset!
      follow_redirect!

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Password updated')
      expect(response.body).to include('Go to the map')
      # Frame 09 carries no back link: the user is already signed in.
      expect(response.body).not_to include('Back to sign in')
    end

    it 'signs the user in, which is what the copy promises' do
      reset!
      follow_redirect!

      expect(controller.current_user).to eq(user)
    end

    it 'is not a page you can sit on — a reload goes to the map' do
      reset!
      follow_redirect!
      get password_updated_path

      expect(response).to redirect_to(root_path)
    end

    it 'is not reachable without having just reset something' do
      get password_updated_path

      expect(response).to redirect_to(root_path)
    end

    it 'leaves a failed reset on the form, not on this screen' do
      put user_password_path,
          params: {
            user: {
              reset_password_token: token,
              password: 'short',
              password_confirmation: 'short',
            },
          }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Choose a new password')
    end
  end

  # The mobile apps call POST /users/password.json. Devise answers 201 with a
  # Location header; both hooks are gated on `request.format.html?` so that
  # header is untouched. iOS, Android and KMP all read only the status, but the
  # gate makes the contract hold by construction rather than by their current
  # implementation.
  describe 'the JSON endpoint the mobile apps call' do
    it 'still points at sign-in, not at the new screen' do
      post '/users/password.json', params: { user: { login: user.email } }, as: :json

      expect(response).to have_http_status(:created)
      expect(URI.parse(response.headers['Location']).path)
        .to eq(new_user_session_path)
    end
  end
end
