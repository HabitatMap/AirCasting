require 'rails_helper'

describe Explore::MapSerializer do
  let(:measured_at) { Time.utc(2026, 10, 16, 12, 0, 0) }

  def station
    Explore::Item.new(
      source: 'government',
      uuid: 'a1b2',
      title: 'CCNY',
      provider: 'US EPA AirNow',
      latitude: 40.82,
      longitude: -73.95,
      last_measured_at: measured_at,
      streams: [
        Explore::ItemStream.new(
          id: 11,
          sensor_name: 'Government-PM2.5',
          parameter: 'Particulate Matter',
          unit_symbol: 'µg/m³',
          last_value: 8.5,
          last_measured_at: measured_at,
        ),
        Explore::ItemStream.new(
          id: 12,
          sensor_name: 'Government-NO2',
          parameter: 'Nitrogen Dioxide',
          unit_symbol: 'ppb',
          last_value: 21.0,
          last_measured_at: measured_at - 1.hour,
        ),
      ],
    )
  end

  it 'serializes an item with one entry per stream, values rounded and times in epoch milliseconds' do
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
          streams: [
            {
              stream_id: 11,
              sensor_name: 'Government-PM2.5',
              measurement_type: 'Particulate Matter',
              unit_symbol: 'µg/m³',
              last_measurement: { value: 9, time: 1_792_152_000_000 },
            },
            {
              stream_id: 12,
              sensor_name: 'Government-NO2',
              measurement_type: 'Nitrogen Dioxide',
              unit_symbol: 'ppb',
              last_measurement: { value: 21, time: 1_792_148_400_000 },
            },
          ],
        },
      ],
    )
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
