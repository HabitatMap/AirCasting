require 'rails_helper'

describe Api::Mobile::AutocompleteController do
  describe '#tags' do
    it 'Returns tags available in the given filters settings' do
      create_tagged_session!(tag: 'tag-correct')
      create_tagged_session!(tag: 'tag-no-contribute', contribute: false)
      create_tagged_session!(
        tag: 'tag-not-in-bounds',
        min_latitude: 15,
        max_latitude: 16,
        min_longitude: 15,
        max_longitude: 16
      )
      create_tagged_session!(
        tag: 'tag-different-sensor-name',
        sensor_name: 'different'
      )
      create_tagged_session!(
        tag: 'tag-different-unit-symbol',
        unit_symbol: 'different'
      )
      create_tagged_session!(tag: 'tag-no-measurements', measurements: false)
      create_tagged_session!(
        tag: 'tag-not-in-time-range',
        start_time_local: Time.new(2_010),
        end_time_local: Time.new(2_011)
      )
      create_tagged_session!(tag: 'not-matching-input')

      get :tags,
          params: {
            q: {
              input: 'tag',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: ''
            }
          }

      expected = %w[tag-correct]

      expect(json_response).to eq(expected)
    end

    it 'Returns tags available in the given filters setting when a username selected' do
      user1 = create_user!(username: 'user1')
      user2 = create_user!(username: 'different')
      create_tagged_session!(tag: 'tag-correct', user: user1)
      create_tagged_session!(tag: 'tag-not-in-usernames', user: user2)

      get :tags,
          params: {
            q: {
              input: 'tag',
              sensor_name: 'AirBeam2-F',
              measurement_type: 'Temperature',
              unit_symbol: 'F',
              north: 10,
              south: 0,
              west: 0,
              east: 10,
              time_from: Time.new(2_018).to_i,
              time_to: Time.new(2_019).to_i,
              usernames: 'user1'
            }
          }

      expected = %w[tag-correct]

      expect(json_response).to eq(expected)
    end
  end

  def create_tagged_session!(attr)
    session =
      create_session!(
        {
          tag_list: [attr.fetch(:tag)],
          contribute: attr.fetch(:contribute, true),
          start_time_local: attr.fetch(:start_time_local, Time.new(2_018, 2)),
          end_time_local: attr.fetch(:end_time_local, Time.new(2_018, 3)),
          user: attr.fetch(:user, create_user!)
        }
      )

    stream =
      create_stream!(
        session: session,
        min_latitude: attr.fetch(:min_latitude, 5),
        max_latitude: attr.fetch(:max_latitude, 5),
        min_longitude: attr.fetch(:min_longitude, 5),
        max_longitude: attr.fetch(:max_longitude, 5),
        sensor_name: attr.fetch(:sensor_name, 'AirBeam2-F'),
        unit_symbol: attr.fetch(:unit_symbol, 'F')
      )

    create_measurement!(stream: stream) if (attr.fetch(:measurements, true))
  end
end
