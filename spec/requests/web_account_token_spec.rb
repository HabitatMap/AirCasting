require 'rails_helper'

# The Devise web forms, not `/api/user`.
#
# `authentication_token` is the credential AirBeams hold in EEPROM and send as
# their HTTP Basic username. No firmware can refresh it, so a token that
# changes means every one of that user's devices stops uploading until each is
# re-paired over BLE by hand. These examples pin that no web form can write it
# and that it can never be stored empty — an empty token is matched by an
# unauthenticated `Basic` header carrying no username at all.
describe 'the authentication token and the Devise web forms', type: :request do
  let(:password) { 'a-good-password' }
  let!(:user) { FactoryBot.create(:user, password: password) }

  describe 'PUT /users' do
    before { sign_in user }

    it 'ignores an authentication_token in the body' do
      expect {
        put '/users', params: {
          user: { authentication_token: 'attacker-chosen', current_password: password },
        }
      }.not_to change { user.reload.authentication_token }
    end

    it 'still applies the changes the form is for' do
      put '/users', params: {
        user: { username: 'new-name', current_password: password },
      }

      expect(user.reload.username).to eq('new-name')
    end
  end

  describe 'POST /users' do
    it 'does not let a new account choose its own token' do
      post '/users', params: {
        user: {
          username: 'fresh',
          email: 'fresh@example.com',
          password: password,
          password_confirmation: password,
          authentication_token: 'chosen-by-the-caller',
        },
      }

      created = User.find_by(username: 'fresh')
      expect(created).to be_present
      expect(created.authentication_token).to be_present
      expect(created.authentication_token).not_to eq('chosen-by-the-caller')
    end
  end

  describe 'an empty token' do
    it 'is regenerated rather than saved' do
      user.authentication_token = ''
      user.save!

      expect(user.reload.authentication_token).to be_present
    end

    it 'fails validation if something skips the callback' do
      user.authentication_token = ''

      expect(user.valid?).to be(true) # the callback repairs it first

      user.define_singleton_method(:ensure_authentication_token) { nil }
      user.authentication_token = ''

      expect(user.valid?).to be(false)
      expect(user.errors[:authentication_token]).to include("can't be blank")
    end
  end

  # The reason the rest of this file exists: a user whose token is empty can be
  # impersonated by anyone, because `""` is truthy in Ruby and the Basic header
  # `base64(":X")` decodes to an empty username.
  it 'does not authenticate a bare Basic header once no token can be empty' do
    get '/api/user.json',
        headers: { 'Authorization' => "Basic #{Base64.strict_encode64(':X')}" }

    expect(response).to have_http_status(:unauthorized)
  end
end
