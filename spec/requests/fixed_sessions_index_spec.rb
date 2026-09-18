require 'rails_helper'

describe 'GET /api/v3/fixed_sessions' do
  let(:user) { create(:user) }

  def get_sessions(query = {})
    get '/api/v3/fixed_sessions',
        params: query,
        headers: {
          'ACCEPT' => 'application/json',
          'Authorization' => "Bearer #{user.authentication_token}",
        }
  end

  describe 'the happy path' do
    it 'returns an envelope of sessions plus pagination meta' do
      session = create(:fixed_session, user: user)
      stream = create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')
      create(:fixed_measurement, stream: stream, value: 12.5, time_with_time_zone: Time.utc(2026, 8, 14, 12, 0, 0))

      get_sessions

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.keys).to match_array(%w[sessions meta])
      expect(json['sessions'].map { |s| s['uuid'] }).to eq([session.uuid])
      expect(json['meta']).to eq(
        'total' => 1,
        'page' => 1,
        'per_page' => FixedSessions::List::DEFAULT_PER_PAGE,
        'total_pages' => 1,
      )
      expect(json['sessions'].first['streams']['AirBeamMini-PM2.5']['last_measurement']).to eq(
        'value' => 12.5,
        'time' => Time.utc(2026, 8, 14, 12, 0, 0).to_i * 1_000,
      )
    end

    it 'returns only the requesting user, ignoring mobile sessions' do
      mine = create(:fixed_session, user: user)
      create(:fixed_session)
      create(:mobile_session, user: user)

      get_sessions

      expect(response.parsed_body['sessions'].map { |s| s['uuid'] }).to eq([mine.uuid])
      expect(response.parsed_body['meta']['total']).to eq(1)
    end

    it 'never puts the upload credential on the wire' do
      create(:fixed_session, user: user, session_token: 'abc123')

      get_sessions

      expect(response.body).not_to include('abc123')
      expect(response.parsed_body['sessions'].first).not_to have_key('session_token')
    end

    it 'walks pages without duplicating or dropping a session' do
      created = create_list(:fixed_session, 5, user: user)

      seen = []
      3.times do |i|
        get_sessions(page: i + 1, per_page: 2)
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['meta']).to include('total' => 5, 'total_pages' => 3)
        seen.concat(response.parsed_body['sessions'].map { |s| s['uuid'] })
      end

      expect(seen).to eq(created.map(&:uuid))
    end

    it 'answers a page past the end with an empty list and an honest total' do
      create_list(:fixed_session, 3, user: user)

      get_sessions(page: 99, per_page: 2)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['sessions']).to eq([])
      expect(response.parsed_body['meta']).to include('total' => 3, 'total_pages' => 2)
    end
  end

  describe 'invalid query parameters' do
    def expect_rejected(field)
      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('validation_error')
      expect(json['fields']).to have_key(field)
    end

    before { create_list(:fixed_session, 3, user: user) }

    it 'rejects a non-numeric per_page instead of returning an empty list' do
      get_sessions(per_page: 'abc')
      expect_rejected('per_page')
    end

    it 'rejects per_page=0 instead of returning an empty list' do
      get_sessions(per_page: 0)
      expect_rejected('per_page')
    end

    it 'rejects a negative per_page instead of 500ing on LIMIT -5' do
      get_sessions(per_page: -5)
      expect_rejected('per_page')
    end

    it 'rejects a per_page above the cap' do
      get_sessions(per_page: FixedSessions::List::MAX_PER_PAGE + 1)
      expect_rejected('per_page')
    end

    it 'rejects page=0' do
      get_sessions(page: 0, per_page: 2)
      expect_rejected('page')
    end

    it 'rejects a non-numeric page instead of silently serving page 1' do
      get_sessions(page: 'abc', per_page: 2)
      expect_rejected('page')
    end
  end

  describe 'authentication' do
    it 'returns 401 without a token' do
      get '/api/v3/fixed_sessions', headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error_code']).to eq('unauthorized')
    end

    it 'returns 401 with an unknown token' do
      get '/api/v3/fixed_sessions',
          headers: { 'ACCEPT' => 'application/json', 'Authorization' => 'Bearer nope' }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
