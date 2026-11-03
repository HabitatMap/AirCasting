require 'rails_helper'

describe Explore::GovStationQuery do
  let(:source) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
  let(:pm) { create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³') }
  let(:ozone) { create(:stream_configuration, measurement_type: 'Ozone', unit_symbol: 'ppb') }
  let(:measured_at) { 1.hour.ago.change(usec: 0) }

  def station(**attributes)
    create(
      :station,
      source: source,
      title: 'Queens College',
      location: 'SRID=4326;POINT(-73.82 40.74)',
      **attributes,
    )
  end

  def stream(station, configuration, last_measured_at: measured_at)
    create(
      :station_stream,
      source: source,
      station: station,
      stream_configuration: configuration,
      location: station.location,
      first_measured_at: last_measured_at,
      last_measured_at: last_measured_at,
    )
  end

  def measurement(stream, value:, at: measured_at)
    create(:station_measurement, station_stream: stream, measured_at: at, value: value)
  end

  it 'returns the station with its streams, their 24h range and its share link, and no device' do
    site = station(url_token: 'ab3k9')
    pm_stream = stream(site, pm)
    measurement(pm_stream, value: 8.5)
    measurement(pm_stream, value: 2.1, at: measured_at - 3.hours)

    item = subject.call(uuid: site.reload.uuid)

    expect(item).to have_attributes(
      source: 'government',
      uuid: site.uuid,
      title: 'Queens College',
      provider: 'US EPA AirNow',
      latitude: 40.74,
      longitude: -73.82,
      time_zone: 'Europe/Warsaw',
      device_model: nil,
      share_url: "http://#{A9n.host_}/g/ab3k9",
      is_active: true,
    )
    expect(item.streams.map(&:to_h)).to eq(
      [
        {
          id: pm_stream.id,
          sensor_name: 'Government-PM2.5',
          parameter: 'Particulate Matter',
          unit_symbol: 'µg/m³',
          last_value: 8.5,
          last_measured_at: measured_at,
          update_frequency: '1 hour',
          min_24h: 2.1,
          max_24h: 8.5,
        },
      ],
    )
  end

  it 'has no share link for a station stored before the token column, not yet backfilled' do
    site = station(url_token: nil)
    measurement(stream(site, pm), value: 8.5)

    expect(subject.call(uuid: site.reload.uuid).share_url).to be_nil
  end

  it 'returns a station that stopped reporting, with its last reading and no 24h range' do
    site = station
    stale = stream(site, pm, last_measured_at: 5.days.ago.change(usec: 0))
    measurement(stale, value: 9.0, at: 5.days.ago.change(usec: 0))

    item = subject.call(uuid: site.reload.uuid)

    expect(item).to have_attributes(is_active: false)
    expect(item.streams.first).to have_attributes(last_value: 9.0, min_24h: nil, max_24h: nil)
  end

  it 'orders streams as the catalogue does' do
    site = station
    measurement(stream(site, ozone), value: 31.0)
    measurement(stream(site, pm), value: 8.5)

    expect(subject.call(uuid: site.reload.uuid).streams.map(&:sensor_name))
      .to eq(%w[Government-PM2.5 Government-Ozone])
  end

  it 'keeps a pollutant the catalogue does not name under its own spelling' do
    site = station
    config = create(:stream_configuration, measurement_type: 'SO2', unit_symbol: 'ppb')
    measurement(stream(site, config), value: 4.0)

    expect(subject.call(uuid: site.reload.uuid).streams.first)
      .to have_attributes(sensor_name: 'Government-SO2', parameter: 'SO2')
  end

  it 'returns nothing for an excluded station, or an unknown uuid' do
    excluded = station(excluded_reason: Station::EXCLUDED_REASONS[:temporary])
    measurement(stream(excluded, pm), value: 8.5)

    expect(subject.call(uuid: excluded.reload.uuid)).to be_nil
    expect(subject.call(uuid: SecureRandom.uuid)).to be_nil
  end

  it 'ignores a non-canonical stream configuration' do
    site = station
    legacy = create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'ppb', canonical: false)
    measurement(stream(site, legacy), value: 8.5)

    expect(subject.call(uuid: site.reload.uuid)).to be_nil
  end
end
