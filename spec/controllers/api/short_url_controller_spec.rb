require 'rails_helper'

describe Api::ShortUrlController do
  describe "GET #index" do
    it "return a shortend link" do
      VCR.use_cassette 'shor_url' do
        get :index, longUrl: "http://example.com", :format => :plain

        expect(response.body).to eq("http://bit.ly/2VVPWJI")
      end
    end
  end
end
