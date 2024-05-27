require 'rails_helper'

describe Api::ThresholdsController do
  describe 'GET #show' do
    it 'returns thresholds' do
      stream = create_stream!(sensor_name: 'AirBeam2-PM2.5')

      get :show, params: { id: 'AirBeam2-PM2.5', unit_symbol: stream.unit_symbol }, format: :json

      expect(json_response).to eq([
        stream.threshold_set.threshold_very_low.to_i,
        stream.threshold_set.threshold_low.to_i,
        stream.threshold_set.threshold_medium.to_i,
        stream.threshold_set.threshold_high.to_i,
        stream.threshold_set.threshold_very_high.to_i,
    ].map(&:to_s))
    end

    it 'checks across all AirBeam versions' do
      stream = create_stream!(sensor_name: 'AirBeam2-PM2.5')

      get :show, params: { id: 'AirBeam-PM2.5', unit_symbol: stream.unit_symbol }, format: :json

      expect(json_response).to eq([
        stream.threshold_set.threshold_very_low.to_i,
        stream.threshold_set.threshold_low.to_i,
        stream.threshold_set.threshold_medium.to_i,
        stream.threshold_set.threshold_high.to_i,
        stream.threshold_set.threshold_very_high.to_i,
      ].map(&:to_s))
    end
  end
end
