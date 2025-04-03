require 'rails_helper'

describe 'GET api/v3/streams' do
  it 'returns list of streams with measurements data' do
    stream = create(:stream, sensor_package_name: 'AirBeam3:123')
    m_1 = create(:measurement, stream: stream)
    m_2 = create(:measurement, stream: stream)

    expected_response = {
      streams: [
        {
          id: stream.id,
          sensor_name: stream.sensor_name,
          sensor_package_name: stream.sensor_package_name,
          measurement_type: stream.measurement_type,
          measurements: [
            {
              value: m_1.value,
              time: m_1.time.strftime('%Y-%m-%d %H:%M:%S'),
              latitude: m_1.latitude,
              longitude: m_1.longitude,
            },
            {
              value: m_2.value,
              time: m_2.time.strftime('%Y-%m-%d %H:%M:%S'),
              latitude: m_2.latitude,
              longitude: m_2.longitude,
            },
          ],
        },
      ],
    }

    get '/api/v3/streams', params: { sensor_package_name: 'AirBeam3:123' }

    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to eq(expected_response.as_json)
  end

  context 'sensor package name param is not provided' do
    it 'returns empty list of streams' do
      expected_response = { streams: [] }

      get '/api/v3/streams'

      expect(response.status).to eq(200)
      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end
end
