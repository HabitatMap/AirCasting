require 'rails_helper'
require './lib/average_info'

describe AverageInfo do
  it 'calculates average for selected session ids' do
    user = create_user!(username: 'name')
    session1 = create_session!(id: 1, user: user)
    stream = create_stream!(session: session1)
    create_measurement!(stream: stream, value: 1)
    session2 = create_session!(id: 2, user: user)
    stream2 = create_stream!(session: session2)
    create_measurement!(stream: stream2, value: 2)

    data = {
      session_ids: [session1.id, session2.id],
      sensor_name: 'AirBeam2-F',
      measurement_type: 'Temperature',
      unit_name: 'Fahrenheit',
      usernames: 'name',
      north: 90,
      south: -90,
      west: -180,
      east: 180,
      grid_size_x: 5,
      grid_size_y: 6,
      time_from: Time.new(2_010).to_i,
      time_to: Time.new(2_100).end_of_year.to_i
    }

    average_info = AverageInfo.new(data).as_json

    expect(average_info.first[:value]).to eq(1.5)
  end

  it 'filters by day_from, day_to, time_from, time_to, year_from, year_to when no session_ids provided' do
    user = create_user!(username: 'name')
    session1 = create_session!(id: 1, user: user)
    stream = create_stream!(session: session1)
    create_measurement!(
      stream: stream, time: Time.new(2_010, 0o1, 0o1, 0o1), value: 1
    )
    session2 = create_session!(id: 2, user: user)
    stream2 = create_stream!(session: session2)
    create_measurement!(
      stream: stream2, time: Time.new(2_010, 0o1, 0o3, 0o1), value: 2
    )
    stream3 = create_stream!(session: session2)
    create_measurement!(
      stream: stream3, time: Time.new(2_010, 0o1, 0o1, 0o3), value: 2
    )
    stream4 = create_stream!(session: session2)
    create_measurement!(
      stream: stream4, time: Time.new(2_011, 0o1, 0o3, 0o1), value: 3
    )

    data = {
      session_ids: [],
      sensor_name: 'AirBeam2-F',
      measurement_type: 'Temperature',
      unit_name: 'Fahrenheit',
      usernames: 'name',
      north: 90,
      south: -90,
      west: -180,
      east: 180,
      grid_size_x: 5,
      grid_size_y: 6,
      day_from: 0,
      day_to: 2,
      time_from: 0,
      time_to: 121,
      year_from: 2_010,
      year_to: 2_010
    }

    average_info = AverageInfo.new(data).as_json

    expect(average_info.first[:value]).to eq(1)
  end
end
