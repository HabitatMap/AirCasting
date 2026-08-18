require 'rails_helper'

describe 'POST /api/v3/mobile_sessions' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }

  def post_session(body)
    post '/api/v3/mobile_sessions',
         params: body.to_json,
         headers: { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
  end

  before do
    create(:threshold_set, :air_beam_pm2_5, :default)
    sign_in user
  end

  let(:valid_body) do
    {
      uuid: SecureRandom.uuid,
      title: 'Bike ride',
      time_zone: 'America/New_York',
      contribute: true,
      airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
      streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
    }
  end

  context 'with a valid body' do
    it 'creates a MobileSession and returns 201 with share_url + streams (no session_token)' do
      expect { post_session(valid_body) }.to change(MobileSession, :count).by(1)

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json['share_url']).to be_present
      expect(json['share_url']).to end_with("/s/#{MobileSession.last.url_token}")
      expect(json).not_to have_key('session_token')
      expect(json['streams']).to eq([{ 'sensor_name' => 'AirBeamMini-PM2.5', 'sensor_type_id' => 2 }])
    end
  end

  context 'when the uuid is already used' do
    it 'returns 400 session_uuid_taken without a fields key' do
      existing = create(:mobile_session, user: user, uuid: SecureRandom.uuid)

      post_session(valid_body.merge(uuid: existing.uuid.upcase))

      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('session_uuid_taken')
      expect(json).not_to have_key('fields')
    end
  end

  context 'when the same sensor type is requested twice' do
    it 'returns 400 validation_error naming the duplicate stream' do
      body = valid_body.merge(
        streams: [
          { sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' },
          { sensor_name: 'AirBeam2-PM2.5', unit_symbol: 'µg/m³' },
        ],
      )

      expect { post_session(body) }.not_to change(MobileSession, :count)

      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('validation_error')
      expect(json.dig('fields', 'streams', '1', 'sensor_name')).to be_present
    end
  end

  context 'when the request body fails contract validation' do
    it 'returns 400 with error_code validation_error and per-field details' do
      post_session(valid_body.except(:time_zone))

      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('validation_error')
      expect(json['message']).to eq('Request body is invalid')
      expect(json['fields']).to have_key('time_zone')
    end
  end

  context 'without authentication' do
    it 'returns unauthorized' do
      sign_out user
      post '/api/v3/mobile_sessions',
           params: valid_body.to_json,
           headers: { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
