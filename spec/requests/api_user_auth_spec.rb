require 'rails_helper'

# Which credentials the `/api/user` account endpoints accept, in one place.
#
# Two schemes, both carrying the same `users.authentication_token`:
#   * `Authorization: Bearer <token>` — what v3 standardised on, and what new
#     clients should send.
#   * `Authorization: Basic base64("<token>:X")` — the original scheme. Every
#     shipped iOS and Android build sends this, so it cannot be withdrawn.
#
# `/api/user/sessions/*` is a different controller and is deliberately not
# here: it stays Basic-only until a client needs otherwise.
describe '/api/user authentication', type: :request do
  let!(:user) { FactoryBot.create(:user, username: 'adam') }

  def bearer(token = user.authentication_token)
    { 'Authorization' => "Bearer #{token}" }
  end

  def basic(token = user.authentication_token)
    { 'Authorization' => "Basic #{Base64.strict_encode64("#{token}:X")}" }
  end

  # Each entry is a request that must answer 200/204 when credentials are good
  # and 401 when they are not.
  ENDPOINTS = {
    'GET /api/user.json' => ->(ctx, headers) { ctx.get '/api/user.json', headers: headers },
    'PATCH /api/user' => lambda do |ctx, headers|
      ctx.patch '/api/user',
                params: { user: { username: 'adam-smith' } },
                headers: headers,
                as: :json
    end,
    'POST /api/user/settings' => lambda do |ctx, headers|
      ctx.post '/api/user/settings',
               params: { data: { session_stopped_alert: true } },
               headers: headers,
               as: :json
    end,
    'POST /api/user/delete_account_send_code' => lambda do |ctx, headers|
      ctx.post '/api/user/delete_account_send_code', headers: headers, as: :json
    end,
  }.freeze

  ENDPOINTS.each do |name, request|
    describe name do
      it 'accepts a bearer token' do
        request.call(self, bearer)

        expect(response).to have_http_status(:ok)
      end

      it 'accepts basic token:X — what every shipped build sends' do
        request.call(self, basic)

        expect(response).to have_http_status(:ok)
      end

      it 'rejects an anonymous request' do
        request.call(self, {})

        expect(response).to have_http_status(:unauthorized)
      end

      it 'rejects an unknown bearer token' do
        request.call(self, bearer('not-a-real-token'))

        expect(response).to have_http_status(:unauthorized)
      end

      it 'rejects an unknown basic token' do
        request.call(self, basic('not-a-real-token'))

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  # Mini V2 posts a *session* token as a bearer to its own v3 route. The two
  # token spaces never overlap — `SecureRandom.hex(16)` is 32 chars, a user
  # token is a 20-char `Devise.friendly_token` — but assert it rather than
  # trust the arithmetic.
  it 'does not accept a fixed session token as a user credential' do
    session = FactoryBot.create(:fixed_session, user: user)

    get '/api/user.json', headers: bearer(session.session_token)

    expect(response).to have_http_status(:unauthorized)
  end

  # `config.http_authenticatable = true`, so devise picks up a real
  # email/username + password Basic header after the token scheme declines it.
  # Pre-existing on every `/api/user` endpoint; pinned so a change is noticed.
  it 'still accepts basic username:password' do
    user.update!(password: 'a-real-password')

    get '/api/user.json',
        headers: {
          'Authorization' => "Basic #{Base64.strict_encode64("#{user.username}:a-real-password")}",
        }

    expect(response).to have_http_status(:ok)
  end
end
