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
    it 'treats an empty string as sent, and fails the match' do
      signup(password_confirmation: '')

      expect(response).to have_http_status(422)
      expect(JSON.parse(response.body)['password_confirmation']).to eq(["doesn't match Password"])
    end
  end

  it 'applies the 8-character minimum' do
    signup(password: 'short')

    expect(response).to have_http_status(422)
    expect(JSON.parse(response.body)['password']).to include(/minimum is 8 characters/)
  end
end
