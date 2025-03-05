require 'rails_helper'

describe 'GET api/v3/timelapse', type: :request do
  context 'with correct params' do
    it 'returns active sessions json with clustering' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)

      # Active session
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
        latitude: active_session.latitude,
        longitude: active_session.longitude,
      )

      # Dormant session (should be clustered together)
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

      create_measurement!(stream: dormant_stream)

      # Session close to the original active session (should be clustered together)
      close_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
          latitude: active_session.latitude + 0.0001,
          longitude: active_session.longitude + 0.0001,
        )

      close_stream =
        create_stream!(
          session: close_session,
          latitude: close_session.latitude,
          longitude: close_session.longitude,
        )

      create_measurement!(
        stream: close_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
      )

      # Session far away (should be isolated)
      far_session =
        create_fixed_session!(
          contribute: true,
          time: session_time,
          last_measurement_at: DateTime.current,
          latitude: active_session.latitude + 10.0,
          longitude: active_session.longitude + 10.0,
        )

      far_stream =
        create_stream!(
          session: far_session,
          latitude: far_session.latitude,
          longitude: far_session.longitude,
        )

      create_measurement!(
        stream: far_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
        latitude: far_session.latitude,
        longitude: far_session.longitude,
      )

      get '/api/v3/timelapse',
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
        (Time.current.beginning_of_hour - 1.hour).utc.strftime(
          '%Y-%m-%d %H:%M:%S UTC',
        ) => [
          {
            'latitude' => 1.0000333333333333,
            'longitude' => 1.0000333333333333,
            'sessions' => 3,
            'value' => 123.0,
          },
          {
            'latitude' => 11.0,
            'longitude' => 11.0,
            'sessions' => 1,
            'value' => 123.0,
          },
        ],
      }

      expect(JSON.parse(response.body)).to eq(expected)
    end
  end
end
