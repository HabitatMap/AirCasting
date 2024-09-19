require 'rails_helper'

describe Api::AutocompleteController do
  describe '#usernames' do
    it 'Returns usernames available in the given filters settings' do
      user1 = create_user!(username: 'user1')
      user2 = create_user!(username: 'user2')
      session =
        create_session!(
          user: user1,
          type: 'FixedSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      session2 =
        create_session!(
          user: user2,
          type: 'FixedSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      stream =
        create_stream!(
          session: session
        )
      stream2 =
        create_stream!(
          session: session2
        )
      create_measurement!(
        stream: stream
      )
      create_measurement!(
        stream: stream2
      )

      get :usernames,
          params: {
            q: {
              input: '',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              tags: '',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: '',
              session_type: 'fixed',
              is_dormant: 'false',
            }
          }

      expected = ["user1", "user2"]

      expect(json_response).to eq(expected)
    end

    it 'Returns usernames of correct sessions for fixed session' do
      user1 = create_user!(username: 'user1')
      user2 = create_user!(username: 'user2')
      session =
        create_session!(
          user: user1,
          type: 'FixedSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      session2 =
        create_session!(
          user: user2,
          type: 'MobileSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      stream =
        create_stream!(
          session: session
        )
      stream2 =
        create_stream!(
          session: session2
        )
      create_measurement!(
        stream: stream
      )
      create_measurement!(
        stream: stream2
      )

      get :usernames,
          params: {
            q: {
              input: '',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              tags: '',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: '',
              session_type: 'fixed',
              is_dormant: 'false',
            }
          }

      expected = ["user1"]

      expect(json_response).to eq(expected)
    end

    it 'Returns usernames of correct sessions for mobile session' do
      user1 = create_user!(username: 'user1')
      user2 = create_user!(username: 'user2')
      session =
        create_session!(
          user: user1,
          type: 'FixedSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      session2 =
        create_session!(
          user: user2,
          type: 'MobileSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      stream =
        create_stream!(
          session: session
        )
      stream2 =
        create_stream!(
          session: session2
        )
      create_measurement!(
        stream: stream
      )
      create_measurement!(
        stream: stream2
      )

      get :usernames,
          params: {
            q: {
              input: '',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              tags: '',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: '',
              session_type: 'mobile',
              is_dormant: 'false',
            }
          }

      expected = ["user2"]

      expect(json_response).to eq(expected)
    end

    it 'Returns usernames of correct sessions for dormant type' do
      user1 = create_user!(username: 'user1')
      user2 = create_user!(username: 'user2')
      session =
        create_session!(
          user: user1,
          type: 'FixedSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3),
          last_measurement_at: Time.new(2_018, 2)
        )
      session2 =
        create_session!(
          user: user2,
          type: 'MobileSession',
          start_time_local: Time.new(2_018, 2),
          end_time_local: Time.new(2_018, 3)
        )
      stream =
        create_stream!(
          session: session
        )
      stream2 =
        create_stream!(
          session: session2
        )
      create_measurement!(
        stream: stream
      )
      create_measurement!(
        stream: stream2
      )

      get :usernames,
          params: {
            q: {
              input: '',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              tags: '',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: '',
              session_type: 'fixed',
              is_dormant: 'true',
            }
          }

      expected = ["user1"]

      expect(json_response).to eq(expected)
    end
  end
end
