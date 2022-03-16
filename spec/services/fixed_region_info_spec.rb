require 'rails_helper'

describe FixedRegionInfo do
  it 'calculates average, number of contributors and number of samples for sessions for given stream for last hour' do
    stream1 = create_stream!
    create_measurements!(stream: stream1, value: 1, count: 60)
    stream2 = create_stream!
    create_measurements!(stream: stream2, value: 2, count: 60)

    region_info = FixedRegionInfo.new.call([stream1.id, stream2.id])

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end

  it "doesn't take into account measurements older than one hour" do
    stream1 = create_stream!
    create_measurements!(stream: stream1, value: 1, count: 60)
    stream2 = create_stream!
    create_measurements!(stream: stream2, value: 2, count: 60)
    create_measurement!(stream: stream2, value: 2, count: 60, time: Time.current - 61.minutes)

    region_info = FixedRegionInfo.new.call([stream1.id, stream2.id])

    expect(region_info[:average]).to eq(1.5)
    expect(region_info[:number_of_contributors]).to eq(2)
    expect(region_info[:number_of_samples]).to eq(120)
    expect(region_info[:number_of_instruments]).to eq(2)
  end
end
