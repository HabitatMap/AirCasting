require 'rails_helper'

describe FixedRegionInfo do
  it 'calculates average, number of contributors and number of samples for sessions for given stream for last hour' do
    user1 = create_user!(id: 1)
    user2 = create_user!(id: 2)
    session1 =
      create_session_with_streams_and_measurements!(
        id: 1, value: 1, user: user1, count: 60
      )
    session2 =
      create_session_with_streams_and_measurements!(
        id: 2, value: 2, user: user2, count: 60
      )

    data = {
      session_ids: [session1.id, session2.id], sensor_name: 'AirBeam2-F'
    }

    region_info = FixedRegionInfo.new.call(data)

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end

  it "doesn't take into account measurements older than one hour" do
    user1 = create_user!(id: 1)
    user2 = create_user!(id: 2)
    session1 =
      create_session_with_streams_and_measurements!(
        id: 1, value: 1, user: user1, count: 60
      )
    session2 = create_session!(id: 2, user: user2)
    stream = create_stream!(session: session2)
    create_measurements!(value: 2, stream: stream, count: 60)
    create_old_measurements!(value: 20, stream: stream)

    data = {
      session_ids: [session1.id, session2.id], sensor_name: 'AirBeam2-F'
    }

    region_info = FixedRegionInfo.new.call(data)

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end
end
