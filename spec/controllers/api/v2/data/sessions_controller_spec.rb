require 'rails_helper'

describe Api::V2::Data::SessionsController do
  describe 'GET last' do
    it 'returns id' do
      FactoryBot.create(:mobile_session)

      get :last

      expect(json_response).to have_key('id')
    end
  end
end
