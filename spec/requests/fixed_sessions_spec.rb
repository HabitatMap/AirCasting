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

  context 'when the uuid is already used' do
    it 'returns 400 session_uuid_taken without a fields key' do
      create(:threshold_set, :air_beam_pm2_5, :default)
      existing = create(:fixed_session, user: user, uuid: SecureRandom.uuid)

      post_session(
        uuid: existing.uuid.upcase,
        title: 'Roof Session',
        latitude: 40.7128,
        longitude: -74.0060,
        contribute: true,
        airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
        streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
      )

      expect(response).to have_http_status(:bad_request)
      json = response.parsed_body
      expect(json['error_code']).to eq('session_uuid_taken')
      expect(json).not_to have_key('fields')
    end
  end
end
