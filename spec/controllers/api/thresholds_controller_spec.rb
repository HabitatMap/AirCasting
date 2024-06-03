require 'rails_helper'

describe Api::ThresholdsController do
  describe 'GET #show' do
    context 'without popularity check' do
      let(:stream) { create_stream!(sensor_name: 'AirBeam2-PM2.5') }

      it 'returns thresholds' do
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

    context 'with more than one threshold_set' do
      let!(:stream1) { create_stream!(sensor_name: 'new-sensor') }
      let!(:stream2) { create_stream!(sensor_name: 'new-sensor') }
      let!(:stream3) { create_stream!(sensor_name: 'new-sensor') }


      it 'returns most popular thresholds if not default' do
        new_threshold_set = create_threshold_set!(sensor_name: 'new-sensor', threshold_very_low: 10)
        stream1.update(threshold_set_id: new_threshold_set.id)
        stream2.update(threshold_set_id: new_threshold_set.id)

        get :show, params: { id: 'new-sensor', unit_symbol: stream1.unit_symbol }, format: :json

        expect(json_response).to eq([
          stream2.threshold_set.threshold_very_low.to_i,
          stream2.threshold_set.threshold_low.to_i,
          stream2.threshold_set.threshold_medium.to_i,
          stream2.threshold_set.threshold_high.to_i,
          stream2.threshold_set.threshold_very_high.to_i,
        ].map(&:to_s))
      end

      it 'returns default threshold if present' do
        stream3.threshold_set.update(is_default: true)

        get :show, params: { id: 'new-sensor', unit_symbol: stream1.unit_symbol }, format: :json

        expect(json_response).to eq([
          stream3.threshold_set.threshold_very_low.to_i,
          stream3.threshold_set.threshold_low.to_i,
          stream3.threshold_set.threshold_medium.to_i,
          stream3.threshold_set.threshold_high.to_i,
          stream3.threshold_set.threshold_very_high.to_i,
        ].map(&:to_s))
      end
    end
  end
end
