require 'rails_helper'

# `PATCH /api/user` backs the three account-settings bottom sheets: change
# email, change username, change password. Each sheet owns one field and sends
# only what it owns.
#
# Which credentials the endpoint accepts is `spec/requests/api_user_auth_spec.rb`;
# here every request is authenticated and the subject is the update itself.
describe 'PATCH /api/user', type: :request do
  let(:password) { 'original-password' }
  let!(:user) do
    FactoryBot.create(
      :user,
      email: 'adam@example.com',
      username: 'adam',
      password: password,
    )
  end

  def auth_header
    { 'Authorization' => "Bearer #{user.authentication_token}" }
  end

  # Positional, not a keyword: ruby 3 would route `patch_user(username: 'x')`
  # into the keyword slot and leave `body` empty.
  def patch_user(body, headers = auth_header)
    patch '/api/user', params: { user: body }, headers: headers, as: :json
  end

  # Errors answer the shared envelope, so every per-field failure lives under
  # `fields` and carries a code the app switches on rather than a sentence it
  # would have to translate.
  def fields
    JSON.parse(response.body).fetch('fields')
  end

  def codes_for(field)
    fields.fetch(field, []).map { |failure| failure['code'] }
  end

  describe 'change username' do
    it 'updates it and answers the current user' do
      patch_user(username: 'adam-smith')

      expect(response).to have_http_status(:ok)
      expect(user.reload.username).to eq('adam-smith')
      expect(JSON.parse(response.body)['username']).to eq('adam-smith')
    end

    it 'rejects a username already taken, case-insensitively' do
      FactoryBot.create(:user, username: 'taken')

      patch_user(username: 'TAKEN')

      expect(response).to have_http_status(422)
      expect(codes_for('username')).to include('taken')
      expect(user.reload.username).to eq('adam')
    end
  end

  describe 'change email' do
    it 'updates it immediately — the app has no email confirmation step' do
      patch_user(email: 'new@example.com')

      expect(response).to have_http_status(:ok)
      expect(user.reload.email).to eq('new@example.com')
    end

    it 'rejects an email already taken' do
      FactoryBot.create(:user, email: 'taken@example.com')

      patch_user(email: 'taken@example.com')

      expect(response).to have_http_status(422)
      expect(codes_for('email')).to include('taken')
      expect(user.reload.email).to eq('adam@example.com')
    end

    it 'rejects a malformed email' do
      patch_user(email: 'not-an-email')

      expect(response).to have_http_status(422)
      expect(user.reload.email).to eq('adam@example.com')
    end
  end

  it 'accepts email and username in one request' do
    patch_user(username: 'adam-smith', email: 'new@example.com')

    expect(response).to have_http_status(:ok)
    user.reload
    expect(user.username).to eq('adam-smith')
    expect(user.email).to eq('new@example.com')
  end

  describe 'change password' do
    def change_password(overrides = {})
      patch_user(
        {
          password: 'brand-new-password',
          password_confirmation: 'brand-new-password',
          current_password: password,
        }.merge(overrides),
      )
    end

    it 'updates it when the current password is correct' do
      change_password

      expect(response).to have_http_status(:ok)
      expect(user.reload.valid_password?('brand-new-password')).to be(true)
      expect(user.valid_password?(password)).to be(false)
    end

    it 'rejects a missing current password' do
      change_password(current_password: nil)

      expect(response).to have_http_status(422)
      expect(codes_for('current_password')).to include('blank')
      expect(user.reload.valid_password?(password)).to be(true)
    end

    it 'rejects a wrong current password' do
      change_password(current_password: 'wrong')

      expect(response).to have_http_status(422)
      expect(codes_for('current_password')).to include('invalid')
      expect(user.reload.valid_password?(password)).to be(true)
    end

    # Devise validates a confirmation only when one is sent, so "sent none"
    # would otherwise sail through and a typo in the single field would lock
    # the user out of their own account.
    it 'rejects a missing confirmation' do
      change_password(password_confirmation: nil)

      expect(response).to have_http_status(422)
      expect(codes_for('password_confirmation')).to include('blank')
      expect(user.reload.valid_password?(password)).to be(true)
    end

    it 'rejects a confirmation that does not match' do
      change_password(password_confirmation: 'something-else')

      expect(response).to have_http_status(422)
      expect(codes_for('password_confirmation')).to include('confirmation_mismatch')
      expect(user.reload.valid_password?(password)).to be(true)
    end

    it 'rejects a password shorter than the configured minimum' do
      change_password(password: 'short', password_confirmation: 'short')

      expect(response).to have_http_status(422)
      # The bound travels as a param so the app can write its own sentence
      # around it rather than parse ours.
      expect(fields['password']).to include(
        a_hash_including(
          'code' => 'too_short',
          'params' => { 'min' => Devise.password_length.min },
        ),
      )
      expect(user.reload.valid_password?(password)).to be(true)
    end

    it 'reports every problem in one response' do
      change_password(password: 'short', password_confirmation: nil, current_password: 'wrong')

      body = JSON.parse(response.body)
      expect(body['error_code']).to eq('validation_error')
      expect(body['fields'].keys)
        .to include('current_password', 'password_confirmation', 'password')
    end
  end

  # AirBeams hold this token in EEPROM and send it as their HTTP Basic
  # username. There is no refresh path in the firmware, so rotating it — or
  # letting a request set it — stops every one of the user's devices uploading
  # until each is re-paired over BLE by hand.
  describe 'the authentication token' do
    it 'survives a password change' do
      expect {
        patch_user(
          password: 'brand-new-password',
          password_confirmation: 'brand-new-password',
          current_password: password,
        )
      }.not_to change { user.reload.authentication_token }

      expect(response).to have_http_status(:ok)
    end

    it 'cannot be set by the request' do
      expect {
        patch_user(username: 'adam-smith', authentication_token: 'attacker-chosen')
      }.not_to change { user.reload.authentication_token }

      expect(response).to have_http_status(:ok)
      expect(user.username).to eq('adam-smith')
    end
  end

  it 'does not let the request grant itself admin' do
    expect {
      patch_user(username: 'adam-smith', admin: true)
    }.not_to change { user.reload.admin }

    expect(response).to have_http_status(:ok)
  end

  # A sheet the user opened but did not type into posts "", not a missing key.
  describe 'blank fields' do
    it 'ignores a blank username alongside a real change' do
      patch_user(username: '', email: 'new@example.com')

      expect(response).to have_http_status(:ok)
      user.reload
      expect(user.username).to eq('adam')
      expect(user.email).to eq('new@example.com')
    end

    it 'ignores a blank password rather than failing the whole request' do
      patch_user(username: 'adam-smith', password: '', password_confirmation: '')

      expect(response).to have_http_status(:ok)
      user.reload
      expect(user.username).to eq('adam-smith')
      expect(user.valid_password?(password)).to be(true)
    end

    it 'rejects a request with nothing to change' do
      patch_user({})

      expect(response).to have_http_status(422)
      expect(codes_for('base')).to eq(['no_attributes'])
    end

    it 'rejects an empty body' do
      patch '/api/user', params: {}, headers: auth_header, as: :json

      expect(response).to have_http_status(422)
      expect(codes_for('base')).to eq(['no_attributes'])
      expect(user.reload.username).to eq('adam')
    end

    it 'rejects a user that is a scalar rather than an object' do
      patch '/api/user', params: { user: 'oops' }, headers: auth_header, as: :json

      expect(response).to have_http_status(422)
      expect(codes_for('base')).to eq(['no_attributes'])
    end

    # `wrap_parameters` puts a bare JSON body under `user` before the action
    # runs, so a client that forgets the envelope still gets served.
    it 'accepts a body sent without the user envelope' do
      patch '/api/user', params: { username: 'adam-smith' }, headers: auth_header, as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.username).to eq('adam-smith')
    end
  end
end
