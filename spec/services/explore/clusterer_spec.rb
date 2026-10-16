require 'rails_helper'

describe Explore::Clusterer do
  def item(latitude:, longitude:, source: 'airbeam', values: { 'pm' => 10.0 })
    Explore::Item.new(
      source: source,
      uuid: SecureRandom.uuid,
      latitude: latitude,
      longitude: longitude,
      streams:
        values.map do |parameter, value|
          Explore::ItemStream.new(parameter: parameter, last_value: value)
        end,
    )
  end

  it 'merges items sharing a cell into one cluster' do
    airbeam = item(latitude: 40.70, longitude: -74.00, values: { 'pm' => 10.0, 'humidity' => 50.0 })
    station = item(latitude: 40.74, longitude: -73.82, source: 'government', values: { 'ozone' => 30.0, 'pm' => 20.0 })
    other_station = item(latitude: 40.80, longitude: -73.90, source: 'government', values: { 'pm' => 30.0 })

    result = described_class.new(5).call([airbeam, station, other_station])

    expect(result.size).to eq(1)
    expect(result.first).to have_attributes(
      count: 3,
      sources: { 'airbeam' => 1, 'government' => 2 },
      bounds: { west: -74.00, east: -73.82, south: 40.70, north: 40.80 },
    )
    expect(result.first.latitude).to be_within(1e-9).of((40.70 + 40.74 + 40.80) / 3)
    expect(result.first.longitude).to be_within(1e-9).of((-74.00 - 73.82 - 73.90) / 3)
  end

  it 'averages each parameter over the items that have it, in catalogue order' do
    items = [
      item(latitude: 40.70, longitude: -74.00, values: { 'ozone' => 30.0, 'pm' => 10.0 }),
      item(latitude: 40.71, longitude: -74.01, values: { 'pm' => 20.0 }),
    ]

    averages = described_class.new(5).call(items).first.averages

    expect(averages).to eq('pm' => 15.0, 'ozone' => 30.0)
    expect(averages.keys).to eq(%w[pm ozone])
  end

  it 'counts an item once per parameter, however many streams it has of it' do
    two_pm_streams =
      Explore::Item.new(
        source: 'government',
        latitude: 40.70,
        longitude: -74.00,
        streams: [10.0, 20.0].map { |value| Explore::ItemStream.new(parameter: 'pm', last_value: value) },
      )
    one_pm_stream = item(latitude: 40.71, longitude: -74.01, values: { 'pm' => 45.0 })

    averages = described_class.new(5).call([two_pm_streams, one_pm_stream]).first.averages

    expect(averages).to eq('pm' => 30.0)
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

  it 'rounds a fractional zoom the way the web map does' do
    expect(described_class.new(15.5).grid.zoom).to eq(16)
    expect(described_class.new(15.4).grid.zoom).to eq(15)
  end

  it 'returns nothing for no items' do
    expect(described_class.new(5).call([])).to eq([])
  end
end
