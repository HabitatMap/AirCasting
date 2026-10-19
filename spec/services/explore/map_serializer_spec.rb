require 'rails_helper'

describe Explore::MapSerializer do
  let(:measured_at) { Time.utc(2026, 10, 16, 12, 0, 0) }

  def station(value: nil)
    Explore::Item.new(
      source: 'government',
      uuid: 'a1b2',
      title: 'CCNY',
      provider: 'US EPA AirNow',
      latitude: 40.82,
      longitude: -73.95,
      last_measured_at: measured_at,
      streams: [
        Explore::ItemStream.new(parameter: 'Particulate Matter', last_value: 8.5),
        Explore::ItemStream.new(parameter: 'Nitrogen Dioxide', last_value: 21.0),
      ],
      value: value,
    )
  end

  it 'serializes an item with its measurement types and epoch-millisecond time' do
    expect(subject.call([station])).to eq(
      items: [
        {
          type: 'station',
          uuid: 'a1b2',
          source: 'government',
          title: 'CCNY',
          provider: 'US EPA AirNow',
          latitude: 40.82,
          longitude: -73.95,
          last_measured_at: 1_792_152_000_000,
          measurement_types: ['Particulate Matter', 'Nitrogen Dioxide'],
        },
      ],
    )
  end

  it 'adds the value, as a whole number, when there is one' do
    expect(subject.call([station(value: 8.5)])[:items].first[:value]).to eq(9)
  end

  it 'serializes a cluster minimally' do
    cluster = Explore::Cluster.new(latitude: 40.7, longitude: -73.9, count: 3)

    expect(subject.call([cluster])).to eq(
      items: [{ type: 'cluster', latitude: 40.7, longitude: -73.9, count: 3 }],
    )
  end

  it "adds a cluster's value, as a whole number, when there is one" do
    cluster = Explore::Cluster.new(latitude: 40.7, longitude: -73.9, count: 3, value: 14.4)

    expect(subject.call([cluster])[:items].first[:value]).to eq(14)
  end
end
