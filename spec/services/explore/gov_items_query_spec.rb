require 'rails_helper'

describe Explore::GovItemsQuery do
  let(:source) { create(:source, name: 'EPA', full_name: 'US EPA AirNow') }
  let(:pm) { create(:stream_configuration, measurement_type: 'PM2.5', unit_symbol: 'µg/m³') }
  let(:ozone) { create(:stream_configuration, measurement_type: 'Ozone', unit_symbol: 'ppb') }
  let(:measured_at) { 1.hour.ago.change(usec: 0) }
  let(:new_york) { Explore::Bounds.new(west: -75, east: -73, south: 40, north: 41) }

  def call(parameters: [], bounds: new_york, title: nil)
    subject.call(
      bounds: bounds,
      parameters: Explore::Parameters.select(parameters),
      title: title,
    )
  end

  def station(longitude: -74.0, latitude: 40.7, **attributes)
    create(
      :station,
      source: source,
      location: "SRID=4326;POINT(#{longitude} #{latitude})",
      **attributes,
    )
  end

  def stream(station, configuration, value: 10.0, last_measured_at: measured_at)
    station_stream =
      create(
        :station_stream,
        source: source,
        station: station,
        stream_configuration: configuration,
        location: station.location,
        first_measured_at: last_measured_at,
        last_measured_at: last_measured_at,
      )
    create(
      :station_measurement,
      station_stream: station_stream,
      measured_at: last_measured_at,
      value: value,
    )
    station_stream
  end

  it 'returns an active station with the latest value of each stream' do
    site = station(title: 'Queens College', longitude: -73.82, latitude: 40.74)
    ozone_stream = stream(site, ozone, value: 31.0)
    pm_stream = stream(site, pm, value: 8.5)

    items = call

    expect(items.size).to eq(1)
    expect(items.first).to have_attributes(
      source: 'government',
      uuid: site.reload.uuid,
      title: 'Queens College',
      provider: 'US EPA AirNow',
      latitude: 40.74,
      longitude: -73.82,
      last_measured_at: measured_at,
    )
    expect(items.first.streams.map(&:to_h)).to eq(
      [
        { id: pm_stream.id, sensor_name: 'Government-PM2.5', parameter: 'Particulate Matter',
          unit_symbol: 'µg/m³', last_value: 8.5, last_measured_at: measured_at },
        { id: ozone_stream.id, sensor_name: 'Government-Ozone', parameter: 'Ozone',
          unit_symbol: 'ppb', last_value: 31.0, last_measured_at: measured_at },
      ],
    )
  end

  it 'returns only the selected parameters, and no station without one' do
    both = station
    stream(both, pm)
    stream(both, ozone)
    ozone_only = station
    stream(ozone_only, ozone)

    items = call(parameters: ['Particulate Matter'])

    expect(items.map(&:uuid)).to eq([both.reload.uuid])
    expect(items.first.streams.map(&:parameter)).to eq(['Particulate Matter'])
  end

  it 'leaves out a station that was excluded' do
    stream(station(excluded_reason: Station::EXCLUDED_REASONS[:temporary]), pm)

    expect(call).to be_empty
  end

  it 'leaves out a stream that is not grouped into a station (EEA today)' do
    create(:station_stream, source: source, stream_configuration: pm,
                            location: 'SRID=4326;POINT(-74.0 40.7)',
                            first_measured_at: measured_at, last_measured_at: measured_at)

    expect(call).to be_empty
  end

  it 'leaves out a stream of a non-canonical configuration' do
    ozone_ugm3 =
      create(:stream_configuration, measurement_type: 'Ozone', unit_symbol: 'µg/m³', canonical: false)
    stream(station, ozone_ugm3)

    expect(call).to be_empty
  end

  it 'leaves out a stream silent for longer than StationStream::ACTIVE_FOR' do
    stream(station, pm, last_measured_at: 25.hours.ago.change(usec: 0))

    expect(call).to be_empty
  end

  it 'leaves out a station outside the bounds' do
    stream(station(longitude: 21.0, latitude: 52.2), pm)

    expect(call).to be_empty
  end

  it 'finds stations on both sides of the antimeridian' do
    east = station(longitude: 179.5, latitude: -17.0)
    west = station(longitude: -179.5, latitude: -17.0)
    far = station(longitude: 0.0, latitude: -17.0)
    [east, west, far].each { |s| stream(s, pm) }

    bounds = Explore::Bounds.new(west: 179, east: -179, south: -18, north: -16)

    expect(call(bounds: bounds).map(&:uuid)).to contain_exactly(
      east.reload.uuid,
      west.reload.uuid,
    )
  end

  it 'filters by title, case-insensitively and literally' do
    stream(station(title: 'Queens College'), pm)
    stream(station(title: 'Bronx 100%'), pm)

    expect(call(title: 'queens').map(&:title)).to eq(['Queens College'])
    expect(call(title: '100%').map(&:title)).to eq(['Bronx 100%'])
    expect(call(title: '%').map(&:title)).to eq(['Bronx 100%'])
  end

  it 'does not query when no selected parameter is measured by government sources' do
    expect(StationStream).not_to receive(:joins)

    expect(call(parameters: ['Temperature', 'Humidity'])).to eq([])
  end
end
