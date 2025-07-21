require 'rails_helper'

describe 'POST api/v3/fixed_streaming/measurements' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  before { sign_in(user) }
  let(:headers) do
    { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' }
  end

  let(:data) do
    {
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
  end

  context 'when user with given session exists' do
    let!(:session) do
      create(
        :fixed_session,
        uuid: 'session123',
        user: user,
        latitude: 50.06,
        longitude: 19.94,
        end_time_local: Time.parse('2025-02-10 08:00'),
        last_measurement_at: nil,
        time_zone: 'Europe/Warsaw',
      )
    end
    it 'creates threshold set, stream and measurements and updates session end timestamps' do
      params = { data: data, compression: false }.to_json

      expect {
        post '/api/realtime/measurements', headers: headers, params: params
      }.to change(ThresholdSet, :count).by(1).and change(Stream, :count).by(
                        1,
                      ).and change(Measurement, :count).by(1).and change(
                                                        FixedMeasurement,
                                                        :count,
                                                      ).by(1)

      expect(response).to be_successful

      expect(session.reload.end_time_local).to eq(
        Time.parse('2025-02-10 08:55:32'),
      )
      expect(session.last_measurement_at).to eq(
        Time.parse('2025-02-10 07:55:32'),
      )

      ts = ThresholdSet.last
      expect(ts.threshold_high).to eq(55)
      expect(ts.threshold_low).to eq(9)
      expect(ts.threshold_medium).to eq(35)
      expect(ts.threshold_very_high).to eq(150)
      expect(ts.threshold_very_low).to eq(0)
      expect(ts.unit_symbol).to eq('µg/m³')
      expect(ts.sensor_name).to eq('AirBeam3-PM1')

      s = Stream.last
      expect(s.threshold_set).to eq(ts)
      expect(s.measurements.count).to eq(1)
      expect(s.min_latitude).to eq(50.06)
      expect(s.max_latitude).to eq(50.06)
      expect(s.min_longitude).to eq(19.94)
      expect(s.max_longitude).to eq(19.94)

      m = Measurement.last
      expect(m.stream).to eq(s)
      expect(m.time).to eq(Time.parse('2025-02-10 08:55:32'))
      expect(m.time_with_time_zone).to eq(Time.parse('2025-02-10 07:55:32'))
      expect(m.latitude).to eq(50.06)
      expect(m.longitude).to eq(19.94)

      fm = FixedMeasurement.last
      expect(fm.stream).to eq(s)
      expect(fm.time).to eq(Time.parse('2025-02-10 08:55:32'))
      expect(fm.time_with_time_zone).to eq(Time.parse('2025-02-10 07:55:32'))
    end

    context 'when threshold set already exists' do
      it 'creates stream and measurement' do
        threshold_set =
          create(
            :threshold_set,
            sensor_name: 'AirBeam3-PM1',
            unit_symbol: 'µg/m³',
          )

        params = { data: data, compression: false }.to_json

        expect {
          post '/api/realtime/measurements', headers: headers, params: params
        }.to change(ThresholdSet, :count).by(0).and change(Stream, :count).by(
                          1,
                        ).and change(Measurement, :count).by(1).and change(
                                                          FixedMeasurement,
                                                          :count,
                                                        ).by(1)

        expect(response).to be_successful
        expect(Stream.last.threshold_set).to eq(threshold_set)
      end
    end

    context 'when stream already exists' do
      it 'creates measurement' do
        stream = create(:stream, session: session, sensor_name: 'AirBeam3-PM1')

        params = { data: data, compression: false }.to_json

        expect {
          post '/api/realtime/measurements', headers: headers, params: params
        }.to change(ThresholdSet, :count).by(0).and change(Stream, :count).by(
                          0,
                        ).and change(Measurement, :count).by(1)

        expect(response).to be_successful
        expect(Measurement.last.stream).to eq(stream)
        expect(FixedMeasurement.last.stream).to eq(stream)
      end

      it 'handles multiple measurements' do
        stream = create(:stream, session: session, sensor_name: 'AirBeam3-PM1')

        data =
          'H4sIAC7FvWcC/62SyW7CMBCGX8XymVAnxmG5tXckDr21lWWSSWLVC/JCRRHvXoeQFsqV28z3/7NY4yPWIHx0oMEEHg47wCuEN8IFWUUlAqC1CAEcnqBrp0+utyNW1rQyxLovyuZ0upyXdEaTNVWOfEam5YJQViYcpD73L0jBMlJkOXklixVjK1rgi/xtDXDbNB5CcpJ+rFRKeqisqf2Ihk1qvhcqwgX+xqcJethq5YNX+0iZB+Ot4ztRfYoWuBHD5GfpXkBomi1nUC7KhgnKCP7z3/k263yQvZfW8Bhl3euXPC/ov6Nx31l3deR1r0cjk3DQW6t6+B4J2bL2SZ+Dc4fQOUiVquadbLtkYuyGKvuV4PKGaahl1AnTW+8e3GFskzNyrw3NyLjY+GYtK2dbJzTagUNV3MoKaej/5ekH2uVT1cICAAA='

        params = { data: data, compression: true }.to_json

        post '/api/realtime/measurements', headers: headers, params: params

        expect(response).to be_successful
        expect(Measurement.count).to eq(2)
        expect(FixedMeasurement.count).to eq(2)
      end

      # due to a firmware bug in AirBeams we need to filter out measurements coming in with future time
      # please refer to: https://trello.com/c/HjEIuSYU/1616-fixed-ab-future-timestamps-problem
      it 'rejects measurements with future timestamps' do
        allow(Time).to receive(:current).and_return(
          Time.parse('2025-02-10 10:00:00'),
        )
        stream = create(:stream, session: session, sensor_name: 'AirBeam3-PM1')
        data =
          'H4sIAF/HvWcC/62Sy27CMBBFf8XymlAnxuGxa/dILLprK8skQ2LVD+QHFUX8e52EtFC27GbOvTO+ln3CGoSPDjSYwMNxD3iF8Ea4IKuoRAC0FiGAwxN07fTJ9XbCyppGhlh3Q9mcTpfzks5osqbJkc/ItFwQysqEg9T9/oIULCNFlpNXslgxtqIFvsjf1gC3u52HkJykO1YqJT1U1tR+REOSmh+EinCBv/V5gh4QjfbRygdH+0idB+Ot43tRfYoGuBHDyc/SvYDQNFvOoFyUOyYoI/jPf+fbrPNB9l5aw2OUdadf+ryg/x6N+9a6q0ded3o0MglHvbWqg++RkC1rnnRf9BtC6yBNqpq3smmTibEbquxXgssbpqGWUSdMb70HcMdxTc7IvTYsI2Ow8c5aVs42Tmi0B4equJUV0tD9y/MPqatIBMICAAA='

        params = { data: data, compression: true }.to_json

        post '/api/realtime/measurements', headers: headers, params: params
        expect(response).to be_successful
        expect(Measurement.count).to eq(1)
        expect(FixedMeasurement.count).to eq(1)
      end

      it 'rejects measurements with future timestamps all' do
        allow(Time).to receive(:current).and_return(
          Time.parse('2025-02-10 10:00:00'),
        )

        stream = create(:stream, session: session, sensor_name: 'AirBeam3-PM1')
        data =
          'H4sIAKPHvWcC/2WRyW7CMBCGXyXyuaFOjMNya+9IHHprK8skQzLCC/JCRRHvXoeQFspt5vv/WTw+EQ3SRwcaTBDhuAeyzMhauoB1VDJAtpIhgCNP2a3TJ9f7iShrWgyx6YvyGZssZhWbsmRNlSOf0kk1p4xXCQfUl/4lLXlOy7xgb3S+5NWSleQqf1sDwm63HkJy0n4sKoUeamsaP6Jhk0YcpIpwhb/x+TNlHoy3TuxlvZMtCCOHyS/oXkFqli+mUM2rLZeMU/Lnf/CtV8Uge4/WiBix6fVrXpTs32WE76y7ueSq16PBJBz1xqoefkRKN7x91pfg0iF0DlKlakSHbZdMnN9RZb8SXNwxDQ1GnTC79x7AHcc2BaeP2tCMjouNb9ZYO9s6qbM9uKyOG6wzDf3nn38AyMv5DycCAAA='

        params = { data: data, compression: true }.to_json

        post '/api/realtime/measurements', headers: headers, params: params
        expect(response).to be_bad_request
        expect(Measurement.count).to eq(0)
        expect(FixedMeasurement.count).to eq(0)
      end
    end
  end

  context 'when user with given session does not exist' do
    it 'returns 400' do
      params = { data: data, compression: false }.to_json

      post '/api/realtime/measurements', headers: headers, params: params

      expect(response).to be_bad_request
    end
  end

  context 'when data is not valid' do
    it 'returns 400' do
      {
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

      post '/api/realtime/measurements', headers: headers, params: params

      expect(response).to be_bad_request
    end
  end
end
