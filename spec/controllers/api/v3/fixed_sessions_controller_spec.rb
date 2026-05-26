require 'rails_helper'

RSpec.describe Api::V3::FixedSessionsController do
  let(:user) { create(:user) }

  before do
    allow(TimeZoneFinderWrapper.instance).to receive(:time_zone_at).and_return('UTC')
    create(:threshold_set, :air_beam_pm2_5, :default)
    sign_in user
  end

  describe 'POST #create' do
    let(:valid_params) do
      {
        uuid: 'test-uuid-abc',
        title: 'Roof Session',
        latitude: 40.7128,
        longitude: -74.0060,
        contribute: true,
        airbeam: { mac_address: 'AA:BB:CC:DD:EE:FF', model: 'AirBeamMini' },
        streams: [{ sensor_name: 'AirBeamMini-PM2.5', unit_symbol: 'µg/m³' }],
      }
    end

    it 'returns 201 and the stream mapping' do
      post :create, params: valid_params, format: :json
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['streams'].first['sensor_type_id']).to eq(2)
      expect(body['location']).to be_present
      expect(body['session_token']).to be_present
    end

    it 'creates a FixedSession' do
      expect {
        post :create, params: valid_params, format: :json
      }.to change(FixedSession, :count).by(1)
    end

    it 'returns 400 for missing required params' do
      post :create, params: { title: 'no uuid' }, format: :json
      expect(response).to have_http_status(:bad_request)
    end
  end
end
