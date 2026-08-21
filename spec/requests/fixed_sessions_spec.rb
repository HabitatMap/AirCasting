require 'rails_helper'

describe 'POST /api/v3/fixed_sessions' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }

  def post_session(body)
    post '/api/v3/fixed_sessions',
         params: body.to_json,
         headers: { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
  end

  before { sign_in user }

  context 'when the request body fails contract validation' do
    it 'returns 400 with error_code validation_error' do
      post_session({ uuid: '' })

      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('validation_error')
      expect(json['message']).to eq('Request body is invalid')
      expect(json['fields']).to be_a(Hash)
    end

    it 'includes per-field details in fields' do
      post_session({ uuid: '' })

      fields = response.parsed_body['fields']
      expect(fields).to have_key('uuid')
    end
  end

  context 'when the same uuid is posted twice' do
    let(:uuid) { SecureRandom.uuid }
    let(:body) do
      {
        uuid: uuid,
        title: 'Roof Session',
        latitude: 40.7128,
        longitude: -74.0060,
        contribute: true,
        device: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
        streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
      }
    end

    before do
      allow(TimeZoneFinderWrapper.instance).to receive(:time_zone_at).and_return('UTC')
      create(:threshold_set, :air_beam_pm2_5, :default)
    end

    # End to end, which is what proves the code the client actually sees. The
    # contract passes a well-formed uuid straight through — it checks shape only —
    # so the refusal comes from the creator, and is session_uuid_taken/409 rather
    # than validation_error/400: the request is not malformed, it conflicts with
    # stored state, and so carries no `fields`.
    it 'rejects the second attempt when nothing was raced' do
      post_session(body)
      expect(response).to have_http_status(:created)
      first = response.parsed_body

      post_session(body)

      expect(response).to have_http_status(:conflict)
      json = response.parsed_body
      expect(json['error_code']).to eq('session_uuid_taken')
      expect(json).not_to have_key('fields')
      expect(Session.where(uuid: uuid).count).to eq(1)
      expect(first['session_token']).to be_present
    end

    it 'rejects a second attempt whose uuid differs only in case' do
      post_session(body)
      expect(response).to have_http_status(:created)

      post_session(body.merge(uuid: uuid.upcase))

      expect(response).to have_http_status(:conflict)
      expect(response.parsed_body['error_code']).to eq('session_uuid_taken')
      expect(Session.where('LOWER(uuid) = ?', uuid.downcase).count).to eq(1)
    end

    # The raced path is deliberately not exercised here. A second sequential
    # request sees the winner's committed row through the model's uniqueness
    # validation and never reaches the unique index. In a genuine race neither
    # request sees the other's uncommitted row, both reach the index, and only
    # then does the loser fall into the reuse path. That is covered by the
    # two-thread examples in spec/models/session_uuid_race_spec.rb, which is the
    # only place it can be reproduced.
  end
end
