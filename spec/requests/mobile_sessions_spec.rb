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
