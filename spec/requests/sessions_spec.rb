require 'rails_helper'

describe 'GET api/v3/sessions' do
  it 'returns list of sessions with streams' do
    session = create(:mobile_session, start_time_local: '2025-01-15T09:00')
    stream =
      create(:stream, session: session, sensor_package_name: 'AirBeam3:123abc')

    expected_response = {
      sessions: [
        {
          id: session.id,
          title: session.title,
          start_datetime:
            session.start_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
          end_datetime: session.end_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
          type: session.type,
          streams: [
            {
              id: stream.id,
              sensor_name: stream.sensor_name,
              measurement_type: stream.measurement_type,
            },
          ],
        },
      ],
    }

    get '/api/v3/sessions',
        params: {
          sensor_package_name: 'AirBeam3:123Abc',
          start_datetime: '2025-01-15T00:00',
          end_datetime: '2025-01-16T00:00',
        }

    expect(response.status).to eq(200)
    expect(JSON.parse(response.body)).to eq(expected_response.as_json)
  end

  context 'params not provided' do
    it 'returns empty list' do
      expected_response = { sessions: [] }

      get '/api/v3/sessions'

      expect(response.status).to eq(200)
      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end
end
