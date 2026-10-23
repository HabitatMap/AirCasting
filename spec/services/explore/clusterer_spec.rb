require 'rails_helper'

describe Explore::Clusterer do
  def item(latitude:, longitude:, source: 'airbeam', value: nil)
    Explore::Item.new(
      source: source,
      uuid: SecureRandom.uuid,
      latitude: latitude,
      longitude: longitude,
      streams: [],
      value: value,
    )
  end

  it 'merges items sharing a cell into one cluster at their mean centre' do
    items = [
      item(latitude: 40.70, longitude: -74.00),
      item(latitude: 40.74, longitude: -73.82, source: 'government'),
      item(latitude: 40.80, longitude: -73.90, source: 'government'),
    ]

    result = described_class.new(5).call(items)

    expect(result.size).to eq(1)
    expect(result.first).to have_attributes(count: 3, value: nil)
    expect(result.first.latitude).to be_within(1e-9).of((40.70 + 40.74 + 40.80) / 3)
    expect(result.first.longitude).to be_within(1e-9).of((-74.00 - 73.82 - 73.90) / 3)
  end

  it "averages its members' values when they have one" do
    items = [
      item(latitude: 40.70, longitude: -74.00, value: 10.0),
      item(latitude: 40.71, longitude: -74.01, value: 15.0),
    ]

    expect(described_class.new(5).call(items).first.value).to eq(12.5)
  end

  it 'leaves a lone item, and items in other cells, as items' do
    new_york = item(latitude: 40.70, longitude: -74.00)
    warsaw = item(latitude: 52.2, longitude: 21.0)

    expect(described_class.new(5).call([new_york, warsaw])).to eq([new_york, warsaw])
  end

  it 'never merges items across the antimeridian' do
    east = item(latitude: -17.0, longitude: 179.99)
    west = item(latitude: -17.0, longitude: -179.99)

    expect(described_class.new(0).call([east, west])).to eq([east, west])
  end

  it 'clusters nothing from NO_CLUSTER_ZOOM on' do
    roof = item(latitude: 40.700000, longitude: -74.000000)
    site = item(latitude: 40.700001, longitude: -74.000001, source: 'government')

    expect(described_class.new(described_class::NO_CLUSTER_ZOOM - 1).call([roof, site]).first)
      .to be_a(Explore::Cluster)
    expect(described_class.new(described_class::NO_CLUSTER_ZOOM).call([roof, site])).to eq([roof, site])
  end

  it 'returns nothing for no items' do
    expect(described_class.new(5).call([])).to eq([])
  end
end
