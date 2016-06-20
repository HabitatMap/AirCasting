require 'spec_helper'

describe Api::V2::Data::SessionsController do
  describe "GET 'last'" do
    before do
      FactoryGirl.create(:mobile_session)

      get :last
    end

    it 'returns id' do
      expect(json_response).to have_key('id')
    end
  end
end
