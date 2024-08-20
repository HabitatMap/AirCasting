require 'rails_helper'

describe Api::V3::FixedStreamClustersController do
  describe '#index2' do
    it 'returns active sessions json' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)
      active_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
        )
      active_stream =
        create_stream!(
          session: active_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      create_measurement!(
        stream: active_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
      )
      dormant_session =
        create_fixed_session!(
          user: active_session.user,
          contribute: true,
          time: session_time,
          last_measurement_at:
            DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      dormant_stream =
        create_stream!(
          session: dormant_session,
          latitude: active_session.latitude,
          longitude: active_session.longitude,
        )
      daily_stream_average =
        create_stream_daily_average!(stream: active_stream)

      create_measurement!(stream: dormant_stream)

      get '/api/v3/timelapse2',
          params: {
            q: {
              time_from: (10.days.ago.to_datetime.strftime('%Q').to_i / 1_000),
              time_to: (Time.now.to_datetime.strftime('%Q').to_i / 1_000),
              tags: '',
              usernames: '',
              session_ids: [],
              west: active_session.longitude - 1,
              east: active_session.longitude + 1,
              south: active_session.latitude - 1,
              north: active_session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: active_stream.sensor_name,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        'fetchableSessionsCount' => 1,
        'sessions' => [
          {
            'id' => active_session.id,
            'uuid' => active_session.uuid,
            'end_time_local' => '2000-10-01T02:03:04.000Z',
            'start_time_local' => '2000-10-01T02:03:04.000Z',
            'last_measurement_value' => active_stream.average_value,
            'is_indoor' => active_session.is_indoor,
            'latitude' => active_session.latitude,
            'longitude' => active_session.longitude,
            'title' => active_session.title,
            'username' => active_session.user.username,
            'streams' => {
              active_stream.sensor_name => {
                'measurement_short_type' =>
                  active_stream.measurement_short_type,
                'sensor_name' => active_stream.sensor_name,
                'unit_symbol' => active_stream.unit_symbol,
                'id' => active_stream.id,
                'stream_daily_average' => daily_stream_average.value.round,
              },
            },
          },
        ],
      }

      puts JSON.pretty_generate(JSON.parse(response.body))

      expect(response.body).to eq(expected)
    end
  end
end
