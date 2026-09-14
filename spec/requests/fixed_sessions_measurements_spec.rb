require 'rails_helper'

describe 'POST /api/v3/fixed_sessions/:fixed_session_uuid/measurements' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  let(:session) { create(:fixed_session, user: user) }

  def post_measurements(uuid:, body:, headers: {})
    post "/api/v3/fixed_sessions/#{uuid}/measurements",
         params: body,
         headers: { 'CONTENT_TYPE' => 'application/octet-stream' }.merge(headers)
  end

  def build_binary
    epoch = Time.current.to_i - 60
    header = ["\xAB\xBA", 1].pack('a2n')
    frame = [epoch, 1, 10.0].pack('NCg')
    payload = header + frame
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  # The scheme the shipped iOS/Android builds use: user token as the Basic
  # username, literal "X" as the password.
  def basic(token)
    { 'Authorization' => "Basic #{Base64.strict_encode64("#{token}:X")}" }
  end

  context 'with empty body (time synchronisation)' do
    before { sign_in user }

    it 'returns 200 without looking up the session' do
      post_measurements(uuid: 'any-uuid', body: '')
      expect(response).to have_http_status(:ok)
    end

    it 'includes X-Server-Time header' do
      post_measurements(uuid: 'any-uuid', body: '')
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  # An AirBeamMini only drops a batch from flash once the server answers 2xx, so
  # a rejection here stalls every later measurement behind it.
  describe 'a payload the device stamped with an unset clock' do
    before { sign_in user }

    let(:stale_binary) do
      stale = Time.utc(2019, 6, 1).to_i
      payload = ["\xAB\xBA", 2].pack('a2n') +
                [stale, 2, 10.0].pack('NCg') + [stale + 1, 2, 11.0].pack('NCg')
      payload + [payload.bytes.inject(0, :^)].pack('C')
    end

    it 'answers 200 and stores nothing' do
      expect {
        post_measurements(uuid: session.uuid, body: stale_binary, headers: bearer(session.session_token))
      }.not_to change(FixedMeasurement, :count)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'payload size cap' do
    before { sign_in user }

    let(:max) { FixedSessions::BinaryProtocol::Parser::MAX_MEASUREMENTS }

    def build_binary_with(frame_count)
      epoch = Time.current.to_i - frame_count
      header = ["\xAB\xBA", frame_count].pack('a2n')
      payload = header + Array.new(frame_count) { |i| [epoch + i, 1, 10.0].pack('NCg') }.join
      payload + [payload.bytes.inject(0, :^)].pack('C')
    end

    it 'rejects a payload one frame over the cap and stores nothing' do
      expect {
        post_measurements(uuid: session.uuid, body: build_binary_with(max + 1), headers: bearer(session.session_token))
      }.not_to change(FixedMeasurement, :count)

      expect(response).to have_http_status(:payload_too_large)
      expect(response.parsed_body['error_code']).to eq('payload_too_large')
    end

    # Decided on Content-Length alone, before the body is read and before the
    # session is looked up — a wrong uuid still answers 413, not 404.
    it 'answers before looking the session up' do
      post_measurements(uuid: 'no-such-uuid', body: build_binary_with(max + 1), headers: bearer(session.session_token))

      expect(response).to have_http_status(:payload_too_large)
    end
  end

  context 'when session does not exist' do
    before { sign_in user }

    it 'returns 404' do
      post_measurements(uuid: 'non-existent-uuid', body: build_binary)
      expect(response).to have_http_status(:not_found)
    end

    it 'includes X-Server-Time header on 404' do
      post_measurements(uuid: 'non-existent-uuid', body: build_binary)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  context 'with valid Bearer session token' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 200' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response).to have_http_status(:ok)
    end

    it 'includes X-Server-Time header' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end

  context 'with invalid Bearer token and no Basic auth' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 401' do
      post_measurements(
        uuid: session.uuid,
        body: build_binary,
        headers: { 'Authorization' => 'Bearer wrong-token' },
      )
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'with Bearer token for wrong session UUID' do
    let(:session) { create(:fixed_session, user: user, session_token: 'valid-token') }

    it 'returns 401' do
      post_measurements(
        uuid: 'different-uuid',
        body: build_binary,
        headers: { 'Authorization' => 'Bearer valid-token' },
      )
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context 'when not authenticated' do
    it 'returns 401' do
      post_measurements(uuid: session.uuid, body: build_binary)
      expect(response).to have_http_status(:unauthorized)
    end

    it 'includes X-Server-Time header on 401' do
      post_measurements(uuid: session.uuid, body: build_binary)
      expect(response.headers['X-Server-Time']).to match(/\A\d+\z/)
    end
  end
  # `Bearer` is overloaded on this endpoint: the AirBeamMini sends its per-session
  # token, v3 mobile clients send the user token. These lock in the precedence.
  describe 'Bearer overload' do
    let(:other_user) { create(:user) }

    it 'accepts Bearer <user_token> for the caller\'s own session' do
      post_measurements(uuid: session.uuid, body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:ok)
    end

    it 'rejects the deprecated Basic <token:X> scheme' do
      post_measurements(uuid: session.uuid, body: build_binary, headers: basic(user.authentication_token))

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 404 for another user's session, not 200" do
      foreign = create(:fixed_session, user: other_user)

      post_measurements(uuid: foreign.uuid, body: build_binary, headers: bearer(user.authentication_token))

      expect(response).to have_http_status(:not_found)
    end

    # A session token is matched against (uuid, session_token) only, so it must
    # never fall through to the account-wide user-token lookup. The firmware
    # posts over plain HTTP, so that token is the more exposed credential.
    it 'resolves the session token first, ignoring the user-token path' do
      tokened = create(:fixed_session, user: other_user, session_token: 'device-token')

      post_measurements(uuid: tokened.uuid, body: build_binary, headers: bearer('device-token'))

      expect(response).to have_http_status(:ok)
    end

    it 'does not let a session token reach a session it was not issued for' do
      create(:fixed_session, user: other_user, session_token: 'device-token')
      victim = create(:fixed_session, user: other_user)

      post_measurements(uuid: victim.uuid, body: build_binary, headers: bearer('device-token'))

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
