require 'rails_helper'

describe CrowdmapAverages::ForWeb do
  it 'returns average for selected session ids when session_ids provided' do
    user = create_user!(username: 'name')
    session1 = create_session!(id: 1, user: user)
    stream1 = create_stream!(session: session1)
    create_measurement!(stream: stream1, value: 1)
    session2 = create_session!(id: 2, user: user)
    stream2 = create_stream!(session: session2)
    create_measurement!(stream: stream2, value: 2)

    data = {
      stream_ids: [stream1.id, stream2.id],
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

    average_info = CrowdmapAverages::ForWeb.new(data).as_json

    expect(average_info.map { |average| average[:value] }).to eq([1.5])
  end
end

describe CrowdmapAverages::ForMobile do
  it 'returns average from requested time range when no session_ids provided' do
    user = create_user!(username: 'name')
    session1 = create_session!(id: 1, user: user)
    stream = create_stream!(session: session1)
    create_measurement!(
      stream: stream,
      time: Time.new(2_010, 1, 1, 1, 1),
      value: 1
    )
    session2 = create_session!(id: 2, user: user)
    stream2 = create_stream!(session: session2)
    create_measurement!(
      stream: stream2,
      time: Time.new(2_010, 1, 3, 1, 1),
      value: 2
    )
    stream3 = create_stream!(session: session2)
    create_measurement!(
      stream: stream3,
      time: Time.new(2_010, 1, 1, 1, 3),
      value: 2
    )
    stream4 = create_stream!(session: session2)
    create_measurement!(
      stream: stream4,
      time: Time.new(2_011, 1, 3, 1, 1),
      value: 3
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
      time_from: Time.new(2_010, 1, 1, 1, 1).to_i,
      time_to: Time.new(2_010, 1, 1, 1, 2).to_i
    }

    average_info = CrowdmapAverages::ForMobile.new(data).as_json

    expect(average_info.map { |average| average[:value] }).to eq([1])
  end
end
