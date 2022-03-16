require 'rails_helper'

describe Api::SensorsController do
  describe 'GET #index' do
    it 'with no streams in database it returns aggregated AirBeam sensors' do
      get :index, params: { session_type: ['MobileSession', 'FixedSession'].sample }

      expect(
        json_response.map { |sensor| sensor.fetch('sensor_name') }
      ).to match_array(
        Sensor.aggregated.map { |sensor| sensor.fetch(:sensor_name) }
      )
    end

    it 'returns a list of sensors that have sessions of given type' do
      mobile_session = create_session!(type: 'MobileSession')
      fixed_session = create_session!(type: 'FixedSession')
      create_stream!(session: mobile_session, sensor_name: 'mobile_sensor')
      create_stream!(session: fixed_session, sensor_name: 'fixed_sensor')
      create_stream!(
        session: mobile_session,
        sensor_name: 'mobile_and_fixed_sensor'
      )
      create_stream!(
        session: fixed_session,
        sensor_name: 'mobile_and_fixed_sensor'
      )

      get :index, params: { session_type: 'MobileSession' }

      expected = [
        {
          'id' => nil,
          'measurement_type' => 'Temperature',
          'sensor_name' => 'mobile_and_fixed_sensor',
          'session_count' => 1,
          'unit_symbol' => 'F'
        },
        {
          'id' => nil,
          'measurement_type' => 'Temperature',
          'sensor_name' => 'mobile_sensor',
          'session_count' => 1,
          'unit_symbol' => 'F'
        }
      ]

      expect(json_response).to include(*expected)
    end

    it 'doesnt return duplicated' do
      session1 = create_session!(type: 'MobileSession')
      create_stream!(session: session1, sensor_name: 'one_sensor')
      session2 = create_session!(type: 'MobileSession')
      create_stream!(session: session2, sensor_name: 'one_sensor')

      get :index, params: { session_type: 'MobileSession' }

      expected = [
        {
          'id' => nil,
          'measurement_type' => 'Temperature',
          'sensor_name' => 'one_sensor',
          'session_count' => 2,
          'unit_symbol' => 'F'
        }
      ]

      expect(
        json_response.filter { |sensor| sensor.fetch('sensor_name') == 'one_sensor' }
      ).to eq(expected)
    end
  end
end
