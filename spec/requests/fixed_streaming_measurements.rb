require 'rails_helper'

describe 'POST api/v3/fixed_streaming/measurements' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  before { sign_in(user) }
  let(:headers) do
    { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
  end

  context 'when there is no stream created' do
    it 'creates stream and measurements' do
      session = create(:fixed_session, uuid: 'session123', user: user)
      data = {
        measurement_type: 'Particulate Matter',
        measurements: [
          {
            longitude: -73.976343,
            latitude: 40.680356,
            time: '2025-02-10T08:55:32',
            timezone_offset: 0,
            milliseconds: 0,
            measured_value: 0,
            value: 0,
          },
        ],
        sensor_package_name: 'AirBeam3-94e686f5a350',
        sensor_name: 'AirBeam3-PM1',
        session_uuid: 'session123',
        measurement_short_type: 'PM',
        unit_symbol: 'µg/m³',
        threshold_high: 55,
        threshold_low: 9,
        threshold_medium: 35,
        threshold_very_high: 150,
        threshold_very_low: 0,
        unit_name: 'microgram per cubic meter',
      }.to_json

      params = { data: data, compression: false }.to_json

      expect {
        post '/api/realtime/measurements', headers: headers, params: params
      }.to change(ThresholdSet, :count).by(1).and change(Stream, :count).by(
                        1,
                      ).and change(Measurement, :count).by(1)

      expect(response).to be_successful
    end
  end
end
