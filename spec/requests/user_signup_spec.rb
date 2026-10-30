require 'rails_helper'

# `POST /api/user.json` — pinned, not changed. Neither released app sends
# `password_confirmation` (Android `CreateAccountParams.kt`, iOS
# `AuthorizationAPI.SignupUserInput`), so the server cannot require it without
# 422-ing every sign-up from every build in the field. These examples record
# that constraint, so tightening the rule later is a deliberate act rather than
# an accident.
describe 'POST /api/user.json', type: :request do
  # Positional: a keyword parameter here would swallow `signup(password: ...)`
  # into the keyword slot under ruby 3.
  def signup(overrides = {})
    post '/api/user.json',
         params: {
           user: {
             username: 'adam',
             email: 'adam@example.com',
             password: 'a-good-password',
           }.merge(overrides),
         },
         as: :json
  end

  describe 'password_confirmation' do
    it 'is not required — an omitted key creates the account' do
      signup

      expect(response).to have_http_status(:created)
      expect(User.find_by(username: 'adam')).to be_present
    end

    it 'is ignored when explicitly null' do
      signup(password_confirmation: nil)

      expect(response).to have_http_status(:created)
    end

    it 'is checked when sent and matching' do
      signup(password_confirmation: 'a-good-password')

      expect(response).to have_http_status(:created)
    end

    it 'is checked when sent and different' do
      signup(password_confirmation: 'something-else')

      expect(response).to have_http_status(422)
      expect(JSON.parse(response.body)).to have_key('password_confirmation')
      expect(User.find_by(username: 'adam')).to be_nil
    end

    # Worth knowing before a new client renders the field: blank is "sent",
    # not "absent", and the message is a mismatch rather than a presence error.
    #
    # The wording is overridden in config/locales/en.yml for the web account
    # screens, and this body carries the same raw message, so a client that
    # displays it verbatim shows the web copy. Deliberate: nothing parses the
    # string, the contract is the key and the array-of-strings shape pinned
    # below, and a copy change is not a breaking change.
    it 'treats an empty string as sent, and fails the match' do
      signup(password_confirmation: '')

      expect(response).to have_http_status(422)
      expect(JSON.parse(response.body)['password_confirmation']).to eq(
        ["Doesn't match the password above"],
      )
    end
  end

  it 'applies the 8-character minimum' do
    signup(password: 'short')

    expect(response).to have_http_status(422)
    expect(JSON.parse(response.body)['password']).to include(/minimum is 8 characters/)
  end

  # This body is read by builds shipped in 2022 that will never be updated, so
  # the envelope sits beside the flat keys rather than replacing them. These
  # examples pin the three things those parsers depend on — anything else here
  # is free to change.
  describe 'the error body, which carries both shapes at once' do
    it 'keeps the flat keys as arrays of plain strings' do
      signup(password: 'short', email: 'not-an-email')

      body = JSON.parse(response.body)

      expect(body['password']).to all(be_a(String))
      expect(body['email']).to all(be_a(String))
    end

    # iOS tests this exact substring to tell "pick another email" apart from a
    # generic failure. Rewording it breaks that alert on every released build.
    it 'keeps the literal uniqueness message the iOS alert matches on' do
      FactoryBot.create(:user, email: 'adam@example.com')

      signup(username: 'someone-else')

      expect(JSON.parse(response.body)['email']).to include('has already been taken')
    end

    it 'stays 422, which is the only status iOS decodes a body from' do
      signup(password: 'short')

      expect(response).to have_http_status(422)
    end

    it 'adds the envelope alongside, for clients that read codes' do
      signup(password: 'short')

      body = JSON.parse(response.body)

      expect(body['error_code']).to eq('validation_error')
      expect(body['message']).to eq('Account could not be created')
      expect(body.dig('fields', 'password')).to include(
        a_hash_including(
          'code' => 'too_short',
          'params' => { 'min' => Devise.password_length.min },
        ),
      )
    end

    it 'says the same thing twice — one field, both shapes' do
      FactoryBot.create(:user, username: 'adam')

      signup(email: 'someone-else@example.com')

      body = JSON.parse(response.body)

      expect(body['username']).to eq(['has already been taken'])
      expect(body.dig('fields', 'username'))
        .to eq([{ 'code' => 'taken', 'message' => 'has already been taken' }])
    end
  end
end
