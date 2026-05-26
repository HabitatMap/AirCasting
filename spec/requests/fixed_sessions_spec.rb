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
end
