require 'rails_helper'

describe Explore::StationSerializer do
  let(:measured_at) { Time.zone.at(1_793_282_400) }

  def stream(**attributes)
    Explore::ItemStream.new(
      id: 35_404,
      sensor_name: 'AirBeam-PM1',
      parameter: 'Particulate Matter',
      unit_symbol: 'µg/m³',
      last_value: 8.4,
      last_measured_at: measured_at,
      update_frequency: '1 minute',
      min_24h: 3.2,
      max_24h: 9.7,
      **attributes,
    )
  end

  def item(**attributes)
    Explore::Item.new(
      source: 'airbeam',
      uuid: '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b',
      title: 'Home AirBeam Garden',
      provider: 'jane',
      latitude: 40.1,
      longitude: -73.2,
      device_model: 'AirBeamMini',
      share_url: 'https://aircasting.org/s/ab12c',
      is_active: true,
      streams: [stream],
      **attributes,
    )
  end

  it 'serialises an AirBeam session, rounding every value as the map draws it' do
    expect(subject.call(item)).to eq(
      uuid: '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b',
      source: 'airbeam',
      title: 'Home AirBeam Garden',
      provider: 'jane',
      latitude: 40.1,
      longitude: -73.2,
      device_model: 'AirBeamMini',
      share_url: 'https://aircasting.org/s/ab12c',
      is_active: true,
      streams: [
        {
          stream_id: 35_404,
          sensor_name: 'AirBeam-PM1',
          measurement_type: 'Particulate Matter',
          unit_symbol: 'µg/m³',
          update_frequency: '1 minute',
          last_measurement: { value: 8, time: 1_793_282_400_000 },
          last_24h: { min: 3, max: 10 },
        },
      ],
    )
  end

  it 'omits share_url entirely for a government station' do
    json = subject.call(item(source: 'government', share_url: nil, device_model: nil))

    expect(json).not_to have_key(:share_url)
    expect(json[:device_model]).to be_nil
  end

  it 'sends null for a stream with no reading and for an empty 24h window' do
    json = subject.call(item(streams: [stream(last_value: nil, last_measured_at: nil, min_24h: nil, max_24h: nil)]))

    expect(json[:streams].first)
      .to include(last_measurement: nil, last_24h: nil, update_frequency: '1 minute')
  end
end
