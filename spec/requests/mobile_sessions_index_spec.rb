require 'rails_helper'

describe 'GET /api/v3/mobile_sessions' do
  let(:user) { create(:user) }

  def get_sessions(query = {})
    get '/api/v3/mobile_sessions',
        params: query,
        headers: {
          'ACCEPT' => 'application/json',
          'Authorization' => "Bearer #{user.authentication_token}",
        }
  end

  describe 'the happy path' do
    it 'returns an envelope of sessions plus pagination meta' do
      session = create(:mobile_session, user: user)
      create(:stream, session: session, sensor_name: 'AirBeamMini-PM2.5')

      get_sessions

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.keys).to match_array(%w[sessions meta])
      expect(json['sessions'].map { |s| s['uuid'] }).to eq([session.uuid])
      expect(json['meta']).to eq(
        'total' => 1,
        'page' => 1,
        'per_page' => MobileSessions::List::DEFAULT_PER_PAGE,
        'total_pages' => 1,
      )
      expect(json['sessions'].first['streams']).to have_key('AirBeamMini-PM2.5')
    end

    it 'returns only the requesting user, ignoring fixed sessions' do
      mine = create(:mobile_session, user: user)
      create(:mobile_session)
      create(:fixed_session, user: user)

      get_sessions

      expect(response.parsed_body['sessions'].map { |s| s['uuid'] }).to eq([mine.uuid])
      expect(response.parsed_body['meta']['total']).to eq(1)
    end

    it 'walks pages without duplicating or dropping a session' do
      created = create_list(:mobile_session, 5, user: user, start_time_local: nil, end_time_local: nil)

      seen = []
      3.times do |i|
        get_sessions(page: i + 1, per_page: 2)
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['meta']).to include('total' => 5, 'total_pages' => 3)
        seen.concat(response.parsed_body['sessions'].map { |s| s['uuid'] })
      end

      expect(seen).to eq(created.reverse.map(&:uuid))
    end

    it 'answers a page past the end with an empty list and an honest total' do
      create_list(:mobile_session, 3, user: user)

      get_sessions(page: 99, per_page: 2)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['sessions']).to eq([])
      expect(response.parsed_body['meta']).to include('total' => 3, 'total_pages' => 2)
    end
  end

  describe 'invalid query parameters' do
    # Each of these used to be silently wrong: a bad per_page returned 200 with
    # an empty list (which the sync contract reads as "everything was deleted"),
    # and a negative one reached Postgres as LIMIT -5 and 500ed.
    def expect_rejected(field)
      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('validation_error')
      expect(json['fields']).to have_key(field)
    end

    before { create_list(:mobile_session, 3, user: user) }

    it 'rejects a non-numeric per_page instead of returning an empty list' do
      get_sessions(per_page: 'abc')
      expect_rejected('per_page')
    end

    it 'rejects an empty per_page instead of returning an empty list' do
      get_sessions(per_page: '')
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
      get_sessions(per_page: MobileSessions::List::MAX_PER_PAGE + 1)
      expect_rejected('per_page')
    end

    it 'rejects a negative page instead of 500ing on OFFSET -2' do
      get_sessions(page: -1, per_page: 2)
      expect_rejected('page')
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

  describe 'page without per_page' do
    it 'applies the default page size rather than ignoring page' do
      create_list(:mobile_session, 3, user: user)

      get_sessions(page: 2)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['sessions']).to eq([])
      expect(response.parsed_body['meta']).to include(
        'page' => 2,
        'per_page' => MobileSessions::List::DEFAULT_PER_PAGE,
        'total' => 3,
      )
    end
  end

  describe 'authentication' do
    it 'returns 401 without a token' do
      get '/api/v3/mobile_sessions', headers: { 'ACCEPT' => 'application/json' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error_code']).to eq('unauthorized')
    end

    it 'returns 401 with an unknown token' do
      get '/api/v3/mobile_sessions',
          headers: { 'ACCEPT' => 'application/json', 'Authorization' => 'Bearer nope' }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
