require 'rails_helper'

describe 'GET api/v3/sessions' do
  context 'when all params are provided' do
    it 'returns list of sessions with streams' do
      session =
        create(
          :mobile_session,
          start_time_local: '2025-01-15T09:00',
          tag_list: ['test_tag'],
        )
      stream =
        create(
          :stream,
          session: session,
          sensor_package_name: 'AirBeam3:123abc',
        )

      _another_session = create(:mobile_session)
      _another_stream = create(:stream, session: _another_session)

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
            tags: 'test_tag',
          }

      expect(response.status).to eq(200)
      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end

  context 'params not provided' do
    it 'returns all sessions from last 30 days' do
      session_1 = create(:mobile_session, start_time_local: 30.days.ago)
      session_2 = create(:fixed_session, start_time_local: 29.days.ago)
      stream_1 = create(:stream, session: session_1)
      stream_2 = create(:stream, session: session_2)
      expected_response = {
        sessions: [
          {
            id: session_1.id,
            title: session_1.title,
            start_datetime:
              session_1.start_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            end_datetime:
              session_1.end_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            type: session_1.type,
            streams: [
              {
                id: stream_1.id,
                sensor_name: stream_1.sensor_name,
                measurement_type: stream_1.measurement_type,
              },
            ],
          },
          {
            id: session_2.id,
            title: session_2.title,
            start_datetime:
              session_2.start_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            end_datetime:
              session_2.end_time_local.strftime('%Y-%m-%dT%H:%M:%S'),
            type: session_2.type,
            streams: [
              {
                id: stream_2.id,
                sensor_name: stream_2.sensor_name,
                measurement_type: stream_2.measurement_type,
              },
            ],
          },
        ],
      }

      get '/api/v3/sessions'

      expect(response.status).to eq(200)
      expect(JSON.parse(response.body)).to eq(expected_response.as_json)
    end
  end

  context 'when end_datetime is before start_datetime' do
    it 'returns 400' do
      get '/api/v3/sessions',
          params: {
            start_datetime: '2025-01-15T00:00',
            end_datetime: '2025-01-10T00:00',
          }

      expect(response.status).to eq(400)
    end
  end
end
