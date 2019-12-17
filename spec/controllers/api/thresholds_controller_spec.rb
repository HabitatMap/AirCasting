require 'rails_helper'

describe Api::ThresholdsController do
  describe 'GET #show' do
    it 'should delegate to stream' do
      expect(Stream).to receive(:thresholds).and_return([1, 2, 3, 4, 5])

      get :show, params: { id: 'mySensor' }, format: :json

      expect(json_response).to eq([1, 2, 3, 4, 5])
    end
  end
end
