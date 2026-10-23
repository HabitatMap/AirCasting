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
