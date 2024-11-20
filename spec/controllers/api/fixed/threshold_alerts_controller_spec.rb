require 'rails_helper'

describe Api::Fixed::ThresholdAlertsController do
  let(:user) { FactoryBot.create(:user) }
  let(:timezone_offset) { -18_000 }

  before { sign_in user }

  describe '#create' do
    let(:uuid) { '123-0345' }

    context 'with valid params' do
      let(:params) do
        {
          sensor_name: 'PM2.5',
          session_uuid: uuid,
          threshold_value: 15.0,
          frequency: 1,
          timezone_offset: timezone_offset,
        }
      end

      it 'creates a record' do
        session = create_session!(uuid: uuid, type: 'FixedSession')
        stream = create_stream!(session: session, sensor_name: 'PM2.5')

        post :create, params: { data: params }, format: :json

        alert = ThresholdAlert.last
        expect(response.status).to eq 201
        expect(response.body).to eq({ id: alert.id }.to_json)
      end
    end

    context 'with invalid params' do
      let(:params) do
        {
          sensor_name: 'PM2.5',
          session_uuid: uuid,
          threshold_value: nil,
          frequency: nil,
          timezone_offset: nil,
        }
      end

      it 'returns errors' do
        session = create_session!(uuid: uuid, type: 'FixedSession')
        stream = create_stream!(session: session, sensor_name: 'PM2.5')
        errors = [
          'threshold_value must be filled',
          'frequency must be filled',
          'timezone_offset must be filled',
        ]

        post :create, params: { data: params }, format: :json

        expect(response.status).to eq 400
        expect(response.body).to eq errors.to_json
      end
    end

    context 'when alert already exists for stream' do
      let(:params) do
        {
          sensor_name: 'PM2.5',
          session_uuid: '123-456',
          threshold_value: 10,
          frequency: 1,
          timezone_offset: timezone_offset,
        }
      end
      errors = ['alert already exists']

      before { sign_in user }

      it do
        session_uuid = '123-456'
        session = create_session!(uuid: session_uuid, type: 'FixedSession')
        stream = create_stream!(session: session, sensor_name: 'PM2.5')
        alert =
          FactoryBot.create(
            :threshold_alert,
            session_uuid: session_uuid,
            sensor_name: 'PM2.5',
            user: user,
            timezone_offset: timezone_offset,
          )

        post :create, params: { data: params }, format: :json

        expect(response.status).to eq 400
        expect(response.body).to eq errors.to_json
      end
    end
  end

  describe '#index' do
    let!(:alert1) do
      FactoryBot.create(
        :threshold_alert,
        user: user,
        session_uuid: '1',
        sensor_name: 'PM2.5',
        timezone_offset: timezone_offset,
      )
    end
    let!(:alert2) do
      FactoryBot.create(
        :threshold_alert,
        user: user,
        session_uuid: '2',
        sensor_name: 'PM10',
        timezone_offset: timezone_offset,
      )
    end

    let(:expected_response) do
      [
        {
          'id' => alert1.id,
          'session_uuid' => '1',
          'sensor_name' => 'PM2.5',
          'frequency' => 1,
          'threshold_value' => 10,
          'timezone_offset' => -18_000,
        },
        {
          'id' => alert2.id,
          'session_uuid' => '2',
          'sensor_name' => 'PM10',
          'frequency' => 1,
          'threshold_value' => 10,
          'timezone_offset' => -18_000,
        },
      ]
    end

    it do
      get :index

      expect(json_response).to eq expected_response
    end
  end

  describe '#destroy' do
    before { sign_in user }

    context 'when alert belongs to user' do
      it do
        alert = FactoryBot.create(:threshold_alert, user: user)

        expect { delete :destroy, params: { id: alert.id } }.to change {
          ThresholdAlert.count
        }.from(1).to 0
      end
    end

    context 'when alert belongs to another user' do
      let(:another_user) { FactoryBot.create(:user) }

      it do
        alert = FactoryBot.create(:threshold_alert, user: another_user)

        expect { delete :destroy, params: { id: alert.id } }.not_to change {
          ThresholdAlert.count
        }
        expect(response.status).to eq 401
      end
    end
  end
end
