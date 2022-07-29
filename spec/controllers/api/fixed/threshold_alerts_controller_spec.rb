require 'rails_helper'

describe Api::Fixed::ThresholdAlertsController do
  describe '#create' do
    let(:user) { FactoryBot.create(:user) }
    let(:uuid)   { '123-0345' }

    before do
      sign_in user
    end

    context 'with valid params' do
      let(:params) {
        {
          sensor_name: 'PM2.5',
          session_uuid: uuid,
          threshold_value: 15.0,
          frequency: 1
        }
      }

      it 'creates a record' do
        session = create_session!(uuid: uuid, type: 'FixedSession')
        stream = create_stream!(session: session, sensor_name: 'PM2.5')

        post :create, params: { data: params }, format: :json

        expect(response.status).to eq 200
      end
    end

    context 'with invalid params' do
      let(:params) {
        {
          sensor_name: 'PM2.5',
          session_uuid: uuid,
          threshold_value: nil,
          frequency: nil
        }
      }

      it 'returns errors' do
        session = create_session!(uuid: uuid, type: 'FixedSession')
        stream = create_stream!(session: session, sensor_name: 'PM2.5')
        errors = ['threshold_value must be filled', 'frequency must be filled']

        post :create, params: { data: params }, format: :json

        expect(response.status).to eq 400
        expect(response.body).to eq errors.to_json
      end
    end
  end

  describe '#destroy_alert' do
    let(:uuid)   { '1234-4567' }
    let(:user)   { FactoryBot.create(:user) }
    let(:params) { { session_uuid: uuid, sensor_name: 'PM2.5' } }

    before do
      sign_in user
    end

    it do
      alert = FactoryBot.create(:threshold_alert, user: user, session_uuid: uuid)

      expect { post :destroy_alert, params: { data: params } }
        .to change { ThresholdAlert.count }.from(1).to 0
    end
  end
end